import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizerService } from './organizer.service';
import { OrganizerController } from './organizer.controller';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';

@Module({
    imports: [PrismaModule],
    providers: [OrganizerService, ComplianceService],
    controllers: [OrganizerController, ComplianceController],
    exports: [OrganizerService, ComplianceService],
})
export class OrganizerModule { }
