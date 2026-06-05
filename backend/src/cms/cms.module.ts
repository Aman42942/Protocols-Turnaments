import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { MediaController } from './media.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [PrismaModule, ActivityLogModule, ConfigModule],
    controllers: [CmsController, MediaController],
    providers: [CmsService],
    exports: [CmsService],
})
export class CmsModule { }
