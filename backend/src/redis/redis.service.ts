import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// ─── In-Memory Store Entry ────────────────────────────────────────────────────
interface MemEntry {
  value: string;
  expiresAt?: number;
}

type SubscriberFn = (message: string) => void;

/**
 * RedisService — Hybrid Implementation
 *
 * Automatically falls back to an in-memory store when Redis is unavailable.
 * 100% API-compatible. Works forever for free with zero Redis dependency.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  private memStore = new Map<string, MemEntry>();
  private memZSets = new Map<string, Map<string, number>>();
  private pubSubHandlers = new Map<string, SubscriberFn[]>();
  private cleanupInterval: NodeJS.Timeout;

  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private publisher: Redis | null = null;
  private useRealRedis = false;

  constructor(private readonly config: ConfigService) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  async onModuleInit() {
    const host = this.config.get<string>('REDIS_HOST') || '127.0.0.1';
    const isLocalhost = host === '127.0.0.1' || host === 'localhost';

    if (!isLocalhost) {
      await this.tryConnectRedis();
    }

    if (!this.useRealRedis) {
      this.logger.log(
        '🧠 [RedisService] Using IN-MEMORY store — no Redis needed (100% free)',
      );
      this.cleanupInterval = setInterval(() => this.cleanupExpired(), 60_000);
    }
  }

  async onModuleDestroy() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    await Promise.all([
      this.client?.quit().catch(() => null),
      this.subscriber?.quit().catch(() => null),
      this.publisher?.quit().catch(() => null),
    ]);
  }

  // ─── Connection ───────────────────────────────────────────────────────────

  private buildOptions() {
    const host = this.config.get<string>('REDIS_HOST') || '127.0.0.1';
    const port = parseInt(this.config.get<string>('REDIS_PORT') || '6379');
    const username = this.config.get<string>('REDIS_USERNAME') || undefined;
    const password = this.config.get<string>('REDIS_PASSWORD') || undefined;
    const tls = this.config.get<string>('REDIS_TLS') === 'true';
    const keyPrefix = this.config.get<string>('REDIS_KEY_PREFIX') || 'protocol:';
    return {
      host, port, username, password, keyPrefix,
      tls: tls ? { rejectUnauthorized: false } : undefined,
      connectTimeout: 5000,
      lazyConnect: true,
      retryStrategy: () => null, // No auto-retry during probe
    };
  }

  private async tryConnectRedis() {
    try {
      const opts = this.buildOptions();
      const probe = new Redis(opts);
      await probe.connect();
      await probe.ping();

      // Success — now build the real 3 clients with retry
      const liveOpts = {
        ...opts,
        retryStrategy: (times: number) => {
          if (times > 10) return null;
          return Math.min(times * 200, 3000);
        },
        lazyConnect: false,
      };

      await probe.quit();

      this.client = new Redis(liveOpts);
      this.subscriber = new Redis(liveOpts);
      this.publisher = new Redis(liveOpts);

      this.client.on('connect', () => this.logger.log('Redis [MAIN] connected'));
      this.client.on('ready', () => this.logger.log('Redis [MAIN] ready'));
      this.client.on('error', (e) => this.logger.error(`Redis [MAIN] error: ${e.message}`));

      this.useRealRedis = true;
      this.logger.log('✅ [RedisService] Connected to real Redis');
    } catch (err: unknown) {
      this.useRealRedis = false;
      this.client = null;
      this.subscriber = null;
      this.publisher = null;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`⚠️  [RedisService] Redis unavailable (${msg}). Using in-memory cache.`);
    }
  }

  // ─── TTL Cleanup ──────────────────────────────────────────────────────────

  private cleanupExpired() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.memStore.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.memStore.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) this.logger.debug(`[MemCache] Cleaned ${cleaned} expired keys`);
  }

  private isExpired(entry: MemEntry): boolean {
    return entry.expiresAt !== undefined && entry.expiresAt < Date.now();
  }

  // ─── Public Accessors ─────────────────────────────────────────────────────

  getClient(): Redis | null { return this.client; }
  getSubscriber(): Redis | null { return this.subscriber; }
  getPublisher(): Redis | null { return this.publisher; }

  // ─── Cache Operations ─────────────────────────────────────────────────────

  async get(key: string): Promise<string | null> {
    if (this.useRealRedis && this.client) {
      try { return await this.client.get(key); } catch { /* fall through */ }
    }
    const entry = this.memStore.get(key);
    if (!entry || this.isExpired(entry)) { this.memStore.delete(key); return null; }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.useRealRedis && this.client) {
      try {
        if (ttlSeconds) { await this.client.setex(key, ttlSeconds, value); }
        else { await this.client.set(key, value); }
        return;
      } catch { /* fall through */ }
    }
    this.memStore.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    if (this.useRealRedis && this.client) {
      try { await this.client.del(key); return; } catch { /* fall through */ }
    }
    this.memStore.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    if (this.useRealRedis && this.client) {
      try { return (await this.client.exists(key)) === 1; } catch { /* fall through */ }
    }
    const entry = this.memStore.get(key);
    return !!entry && !this.isExpired(entry);
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    if (this.useRealRedis && this.client) {
      try {
        const val = await this.client.incr(key);
        if (ttlSeconds && val === 1) await this.client.expire(key, ttlSeconds);
        return val;
      } catch { /* fall through */ }
    }
    const entry = this.memStore.get(key);
    const current = entry && !this.isExpired(entry) ? parseInt(entry.value) : 0;
    const next = current + 1;
    this.memStore.set(key, {
      value: String(next),
      expiresAt: ttlSeconds && next === 1
        ? Date.now() + ttlSeconds * 1000
        : entry?.expiresAt,
    });
    return next;
  }

  // ─── Leaderboard (Sorted Sets) ────────────────────────────────────────────

  async leaderboardUpdate(
    boardKey: string, memberId: string, score: number, ttlSeconds = 3600,
  ): Promise<void> {
    if (this.useRealRedis && this.client) {
      try {
        await this.client.zadd(boardKey, score, memberId);
        await this.client.expire(boardKey, ttlSeconds);
        return;
      } catch { /* fall through */ }
    }
    if (!this.memZSets.has(boardKey)) this.memZSets.set(boardKey, new Map());
    this.memZSets.get(boardKey)!.set(memberId, score);
  }

  async leaderboardTop(
    boardKey: string, count = 50,
  ): Promise<Array<{ memberId: string; score: number }>> {
    if (this.useRealRedis && this.client) {
      try {
        const raw = await this.client.zrevrange(boardKey, 0, count - 1, 'WITHSCORES');
        const result: Array<{ memberId: string; score: number }> = [];
        for (let i = 0; i < raw.length; i += 2) {
          result.push({ memberId: raw[i], score: parseFloat(raw[i + 1]) });
        }
        return result;
      } catch { /* fall through */ }
    }
    const zset = this.memZSets.get(boardKey);
    if (!zset) return [];
    return Array.from(zset.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([memberId, score]) => ({ memberId, score }));
  }

  async leaderboardDelete(boardKey: string): Promise<void> {
    if (this.useRealRedis && this.client) {
      try { await this.client.del(boardKey); return; } catch { /* fall through */ }
    }
    this.memZSets.delete(boardKey);
  }

  // ─── Pub / Sub ─────────────────────────────────────────────────────────────

  async publish(channel: string, message: string): Promise<void> {
    if (this.useRealRedis && this.publisher) {
      try { await this.publisher.publish(channel, message); return; } catch { /* fall through */ }
    }
    const handlers = this.pubSubHandlers.get(channel) ?? [];
    handlers.forEach(fn => { try { fn(message); } catch { /* ignore */ } });
  }

  async subscribe(channel: string, handler: SubscriberFn): Promise<void> {
    if (this.useRealRedis && this.subscriber) {
      try {
        await this.subscriber.subscribe(channel);
        this.subscriber.on('message', (ch: string, msg: string) => {
          if (ch === channel) handler(msg);
        });
        return;
      } catch { /* fall through */ }
    }
    if (!this.pubSubHandlers.has(channel)) this.pubSubHandlers.set(channel, []);
    this.pubSubHandlers.get(channel)!.push(handler);
  }

  // ─── Health Check ─────────────────────────────────────────────────────────

  async ping(): Promise<boolean> {
    if (this.useRealRedis && this.client) {
      try { return (await this.client.ping()) === 'PONG'; } catch { return false; }
    }
    return true; // In-memory is always alive
  }

  async healthCheck(): Promise<{
    status: 'ok' | 'error';
    latencyMs: number;
    connectedClients: number;
    mode: string;
  }> {
    const start = Date.now();
    const alive = await this.ping();
    const latencyMs = Date.now() - start;

    let connectedClients = 0;
    if (this.useRealRedis && this.client && alive) {
      try {
        const info = await this.client.info('clients');
        const match = info.match(/connected_clients:(\d+)/);
        connectedClients = match ? parseInt(match[1]) : 0;
      } catch { /* ignore */ }
    }

    return {
      status: alive ? 'ok' : 'error',
      latencyMs,
      connectedClients,
      mode: this.useRealRedis ? 'redis' : 'in-memory',
    };
  }
}
