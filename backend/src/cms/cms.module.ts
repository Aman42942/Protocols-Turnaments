import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
    imports: [PrismaModule, ActivityLogModule],
    controllers: [CmsController],
    providers: [CmsService],
    exports: [CmsService],
})
export class CmsModule { }
