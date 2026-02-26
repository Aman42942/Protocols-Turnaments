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
 * Wraps Redis sorted sets to provide fast O(log N) leaderboard operations.
 * Caches top-50 per tournament. Invalidated on any score update.
 *
 * Key format: `protocol:lb:{tournamentId}`
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
   * O(log N) — Redis sorted set zadd.
   */
  async updateScore(
    tournamentId: string,
    userId: string,
    score: number,
  ): Promise<void> {
    const k = this.key(tournamentId);
    await this.redis.leaderboardUpdate(k, userId, score, LEADERBOARD_TTL);
    this.logger.debug(
      `Leaderboard updated: ${tournamentId} — ${userId} = ${score}`,
    );
  }

  /**
   * Get top N players sorted by score descending.
   * Returns [{ userId, score, rank }]
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

    const [rank, score] = await Promise.all([
      client.zrevrank(k, userId),
      client.zscore(k, userId),
    ]);

    if (rank === null || score === null) return null;

    return {
      rank: rank + 1, // 0-indexed → 1-indexed
      score: parseFloat(score),
    };
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
    const newScore = await client.zincrby(k, by, userId);
    await client.expire(k, LEADERBOARD_TTL);
    return parseFloat(newScore);
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

    // zadd accepts [score, member, score, member, ...] pairs
    const args: Array<string | number> = [];
    for (const e of entries) {
      args.push(e.score, e.userId);
    }
    await (client.zadd as any)(k, ...args);
    await client.expire(k, LEADERBOARD_TTL);
    this.logger.log(
      `Leaderboard seeded: ${tournamentId} (${entries.length} entries)`,
    );
  }
}
