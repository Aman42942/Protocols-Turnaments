import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { ActivityLogModule } from '../activity-log/activity-log.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [PrismaModule, ActivityLogModule, SecurityModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
