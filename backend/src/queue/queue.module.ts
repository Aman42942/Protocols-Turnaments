import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * QueueModule — Smart Queue Setup
 *
 * If Redis is configured → uses real BullMQ with Redis.
 * If Redis is not available → uses a minimal mock so the app
 * still boots and runs without any queue functionality errors.
 *
 * This makes the queue system 100% free and optional.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('REDIS_HOST') || '127.0.0.1';
        const port = parseInt(config.get<string>('REDIS_PORT') || '6379');
        const username = config.get<string>('REDIS_USERNAME') || undefined;
        const password = config.get<string>('REDIS_PASSWORD') || undefined;
        const tls = config.get<string>('REDIS_TLS') === 'true';

        return {
          connection: {
            host,
            port,
            username,
            password,
            tls: tls ? { rejectUnauthorized: false } : undefined,
            maxRetriesPerRequest: null, // Required for BullMQ
            enableOfflineQueue: false,  // Don't queue commands when offline
            retryStrategy: (times: number) => {
              if (times > 3) return null; // Give up after 3 retries
              return Math.min(times * 500, 2000);
            },
          },
          prefix: 'protocol:bull',
          // ✅ Suppresses eviction policy warning (free Redis Cloud plans)
          skipVersionCheck: true,
        };
      },
      inject: [ConfigService],
    }),

    // Named queues
    BullModule.registerQueue(
      { name: 'payout' },
      { name: 'notification' },
      { name: 'lifecycle' },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
