import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

/**
 * Global queue registry — now using Redis Cloud via host/port/password.
 * RedisService provides the ioredis connection details.
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
                        enableOfflineQueue: true,
                        retryStrategy: (times: number) =>
                            Math.min(times * 200, 3000),
                    },
                    prefix: 'protocol:bull', // Key prefix for all BullMQ keys
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
export class QueueModule { }
