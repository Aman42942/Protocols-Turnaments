import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, NotificationsModule],
    providers: [SecurityService],
    controllers: [SecurityController],
    exports: [SecurityService],
})
export class SecurityModule { }
