import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

const LEADERBOARD_TTL = 60 * 5; // 5 minutes cache per tournament leaderboard
const LEADERBOARD_PREFIX = 'lb:';

export interface LeaderboardEntry {
  userId: string;
  score: number;
  rank: number;
}

/**
 * LeaderboardCacheService
 *
 * Uses RedisService's built-in methods which automatically fall back
 * to in-memory sorted sets when Redis is unavailable.
 * Zero crashes — works 100% free without any Redis server.
 */
@Injectable()
export class LeaderboardCacheService {
  private readonly logger = new Logger(LeaderboardCacheService.name);

  constructor(private readonly redis: RedisService) {}

  private key(tournamentId: string): string {
    return `${LEADERBOARD_PREFIX}${tournamentId}`;
  }

  /**
   * Update or insert a player's score.
   */
  async updateScore(
    tournamentId: string,
    userId: string,
    score: number,
  ): Promise<void> {
    const k = this.key(tournamentId);
    await this.redis.leaderboardUpdate(k, userId, score, LEADERBOARD_TTL);
    this.logger.debug(`Leaderboard updated: ${tournamentId} — ${userId} = ${score}`);
  }

  /**
   * Get top N players sorted by score descending.
   */
  async getTop(tournamentId: string, count = 50): Promise<LeaderboardEntry[]> {
    const k = this.key(tournamentId);
    const raw = await this.redis.leaderboardTop(k, count);
    return raw.map((entry, index) => ({
      userId: entry.memberId,
      score: entry.score,
      rank: index + 1,
    }));
  }

  /**
   * Get a single player's rank and score.
   * Returns null if player not in leaderboard.
   */
  async getPlayerRank(
    tournamentId: string,
    userId: string,
  ): Promise<{ rank: number; score: number } | null> {
    const k = this.key(tournamentId);
    const client = this.redis.getClient();

    // If real Redis is available, use native commands
    if (client) {
      try {
        const [rank, score] = await Promise.all([
          client.zrevrank(k, userId),
          client.zscore(k, userId),
        ]);
        if (rank === null || score === null) return null;
        return { rank: rank + 1, score: parseFloat(score) };
      } catch {}
    }

    // In-memory fallback: compute rank from sorted leaderboard
    const top = await this.redis.leaderboardTop(k, 10000);
    const idx = top.findIndex(e => e.memberId === userId);
    if (idx === -1) return null;
    return { rank: idx + 1, score: top[idx].score };
  }

  /**
   * Increment a player's score (e.g. after each kill/point).
   */
  async incrementScore(
    tournamentId: string,
    userId: string,
    by: number,
  ): Promise<number> {
    const k = this.key(tournamentId);
    const client = this.redis.getClient();

    // If real Redis is available, use native zincrby
    if (client) {
      try {
        const newScore = await client.zincrby(k, by, userId);
        await client.expire(k, LEADERBOARD_TTL);
        return parseFloat(newScore);
      } catch {}
    }

    // In-memory fallback: get current score, add increment, update
    const current = await this.redis.leaderboardTop(k, 10000);
    const entry = current.find(e => e.memberId === userId);
    const currentScore = entry ? entry.score : 0;
    const newScore = currentScore + by;
    await this.redis.leaderboardUpdate(k, userId, newScore, LEADERBOARD_TTL);
    return newScore;
  }

  /**
   * Wipe leaderboard (call when tournament ends and prizes distributed).
   */
  async clear(tournamentId: string): Promise<void> {
    await this.redis.leaderboardDelete(this.key(tournamentId));
    this.logger.log(`Leaderboard cleared: ${tournamentId}`);
  }

  /**
   * Bulk-seed leaderboard from DB results (on server restart or tournament LIVE).
   */
  async seed(
    tournamentId: string,
    entries: Array<{ userId: string; score: number }>,
  ): Promise<void> {
    if (!entries.length) return;
    const k = this.key(tournamentId);
    const client = this.redis.getClient();

    if (client) {
      try {
        const args: Array<string | number> = [];
        for (const e of entries) args.push(e.score, e.userId);
        await (client.zadd as any)(k, ...args);
        await client.expire(k, LEADERBOARD_TTL);
        this.logger.log(`Leaderboard seeded (Redis): ${tournamentId} (${entries.length} entries)`);
        return;
      } catch {}
    }

    // In-memory fallback: seed one by one
    for (const e of entries) {
      await this.redis.leaderboardUpdate(k, e.userId, e.score, LEADERBOARD_TTL);
    }
    this.logger.log(`Leaderboard seeded (memory): ${tournamentId} (${entries.length} entries)`);
  }
}
