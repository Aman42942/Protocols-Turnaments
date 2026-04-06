import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { LeaderboardCacheService } from './leaderboard-cache.service';

/**
 * Global Redis Module
 * Provides a singleton ioredis connection reusable across all modules.
 * No need to import this in every module — it's @Global().
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, LeaderboardCacheService],
  exports: [RedisService, LeaderboardCacheService],
})
export class RedisModule {}
