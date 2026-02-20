import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);

    /** Main client — used for get/set/cache/rate-limit */
    private client: Redis;

    /** Subscriber client — dedicated connection for pub/sub (ioredis rule: subscriber can't run commands) */
    private subscriber: Redis;

    /** Publisher client — dedicated connection for publishing events */
    private publisher: Redis;

    constructor(private readonly config: ConfigService) { }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    async onModuleInit() {
        const options = this.buildOptions();
        this.client = this.createClient('MAIN', options);
        this.subscriber = this.createClient('SUB', options);
        this.publisher = this.createClient('PUB', options);

        // Wait for all connections to be ready before the app starts
        await Promise.all([
            this.waitReady(this.client, 'MAIN'),
            this.waitReady(this.subscriber, 'SUB'),
            this.waitReady(this.publisher, 'PUB'),
        ]);
    }

    async onModuleDestroy() {
        this.logger.log('Closing Redis connections...');
        await Promise.all([
            this.client?.quit(),
            this.subscriber?.quit(),
            this.publisher?.quit(),
        ]);
        this.logger.log('Redis connections closed.');
    }

    // ─── Connection Builder ───────────────────────────────────────────────────

    private buildOptions(): RedisOptions {
        const host = this.config.get<string>('REDIS_HOST') || '127.0.0.1';
        const port = parseInt(this.config.get<string>('REDIS_PORT') || '6379');
        const username = this.config.get<string>('REDIS_USERNAME') || undefined;
        const password = this.config.get<string>('REDIS_PASSWORD') || undefined;
        const tls = this.config.get<string>('REDIS_TLS') === 'true';
        const keyPrefix = this.config.get<string>('REDIS_KEY_PREFIX') || 'protocol:';

        return {
            host,
            port,
            username,
            password,
            keyPrefix,
            tls: tls ? { rejectUnauthorized: false } : undefined,
            // Auto-reconnect strategy: exponential backoff, max 10 retries
            retryStrategy: (times: number) => {
                if (times > 10) {
                    this.logger.error(`Redis: max reconnect attempts (${times}) reached`);
                    return null; // Stop retrying
                }
                const delay = Math.min(times * 200, 3000);
                this.logger.warn(`Redis: reconnecting in ${delay}ms (attempt ${times})`);
                return delay;
            },
            enableOfflineQueue: true,
            maxRetriesPerRequest: 3,
            lazyConnect: false,
            connectTimeout: 10000,
        };
    }

    private createClient(name: string, options: RedisOptions): Redis {
        const client = new Redis(options);

        client.on('connect', () => this.logger.log(`Redis [${name}] connected`));
        client.on('ready', () => this.logger.log(`Redis [${name}] ready`));
        client.on('error', (err) =>
            this.logger.error(`Redis [${name}] error: ${err.message}`),
        );
        client.on('close', () => this.logger.warn(`Redis [${name}] connection closed`));
        client.on('reconnecting', (delay: number) =>
            this.logger.warn(`Redis [${name}] reconnecting in ${delay}ms`),
        );

        return client;
    }

    private waitReady(client: Redis, name: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (client.status === 'ready') return resolve();
            client.once('ready', resolve);
            client.once('error', (err) => {
                this.logger.error(`Redis [${name}] failed to connect: ${err.message}`);
                reject(err);
            });
        });
    }

    // ─── Public Accessors ─────────────────────────────────────────────────────

    /** Raw ioredis client — for BullMQ, advanced usage */
    getClient(): Redis {
        return this.client;
    }

    /** Dedicated pub/sub subscriber client */
    getSubscriber(): Redis {
        return this.subscriber;
    }

    /** Dedicated publisher client */
    getPublisher(): Redis {
        return this.publisher;
    }

    // ─── Cache Operations ─────────────────────────────────────────────────────

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, value);
        } else {
            await this.client.set(key, value);
        }
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    async exists(key: string): Promise<boolean> {
        const result = await this.client.exists(key);
        return result === 1;
    }

    async increment(key: string, ttlSeconds?: number): Promise<number> {
        const val = await this.client.incr(key);
        if (ttlSeconds && val === 1) {
            // Only set TTL on first increment (prevents resetting)
            await this.client.expire(key, ttlSeconds);
        }
        return val;
    }

    // ─── Leaderboard (Sorted Sets) ────────────────────────────────────────────

    /**
     * Add/update a score in a leaderboard sorted set.
     * Used for real-time tournament rankings.
     */
    async leaderboardUpdate(
        boardKey: string,
        memberId: string,
        score: number,
        ttlSeconds = 3600,
    ): Promise<void> {
        await this.client.zadd(boardKey, score, memberId);
        await this.client.expire(boardKey, ttlSeconds);
    }

    /**
     * Get top N entries from a leaderboard (highest score first).
     */
    async leaderboardTop(
        boardKey: string,
        count = 50,
    ): Promise<Array<{ memberId: string; score: number }>> {
        const raw = await this.client.zrevrange(boardKey, 0, count - 1, 'WITHSCORES');
        const result: Array<{ memberId: string; score: number }> = [];
        for (let i = 0; i < raw.length; i += 2) {
            result.push({ memberId: raw[i], score: parseFloat(raw[i + 1]) });
        }
        return result;
    }

    /**
     * Remove a leaderboard (e.g., after tournament ends and prizes distributed).
     */
    async leaderboardDelete(boardKey: string): Promise<void> {
        await this.client.del(boardKey);
    }

    // ─── Pub / Sub ───────────────────────────────────────────────────────────

    async publish(channel: string, message: string): Promise<void> {
        await this.publisher.publish(channel, message);
    }

    async subscribe(
        channel: string,
        handler: (message: string) => void,
    ): Promise<void> {
        await this.subscriber.subscribe(channel);
        this.subscriber.on('message', (ch, msg) => {
            if (ch === channel) handler(msg);
        });
    }

    // ─── Health Check ─────────────────────────────────────────────────────────

    async ping(): Promise<boolean> {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        } catch {
            return false;
        }
    }

    async healthCheck(): Promise<{
        status: 'ok' | 'error';
        latencyMs: number;
        connectedClients: number;
    }> {
        const start = Date.now();
        const alive = await this.ping();
        const latencyMs = Date.now() - start;

        if (!alive) {
            return { status: 'error', latencyMs, connectedClients: 0 };
        }

        // Get info from Redis server
        const info = await this.client.info('clients');
        const match = info.match(/connected_clients:(\d+)/);
        const connectedClients = match ? parseInt(match[1]) : 0;

        return { status: 'ok', latencyMs, connectedClients };
    }
}
