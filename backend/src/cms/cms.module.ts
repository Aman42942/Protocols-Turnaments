import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { MediaController } from './media.controller';

@Module({
    imports: [PrismaModule, ActivityLogModule],
    controllers: [CmsController, MediaController],
    providers: [CmsService],
    exports: [CmsService],
})
export class CmsModule { }
