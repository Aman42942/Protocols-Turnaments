import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaModule } from '../prisma/prisma.module';

// RedisService is globally available because RedisModule is @Global()
// No need to import RedisModule here directly

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule { }
