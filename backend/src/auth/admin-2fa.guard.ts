import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { UserRole } from './role.enum';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Admin2faGuard implements CanActivate {
  private readonly logger = new Logger(Admin2faGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ip = request.ip || request.connection?.remoteAddress || 'Unknown';
    const device = request.headers['user-agent'] || 'Unknown Device';

    // Staff roles that require 2FA and IP consistency
    const staffRoles = [
      UserRole.ULTIMATE_ADMIN,
      UserRole.SUPERADMIN,
      UserRole.SENIOR_CHIEF_SECURITY_ADMIN,
      UserRole.CHIEF_DEVELOPMENT_ADMIN,
      UserRole.CHIEF_SECURITY_ADMIN,
      UserRole.VICE_CHIEF_SECURITY_ADMIN,
      UserRole.SENIOR_ADMIN,
      UserRole.ADMIN,
      UserRole.JUNIOR_ADMIN,
    ];

    if (user && staffRoles.includes(user.role)) {
      // 1. Mandatory 2FA Check
      if (!user.twoFactorEnabled) {
        // ULTIMATE_ADMIN (Owner) can perform critical actions or view logs without absolute 2FA roadblock in certain contexts
        if (user.role === UserRole.ULTIMATE_ADMIN && (request.method === 'GET' || request.url.includes('admin/refund'))) {
          this.logger.log(`Admin ${user.email} (ULTIMATE_ADMIN) allowed ${request.method} access to ${request.url} without 2FA.`);
          return true;
        }

        this.logger.warn(`Admin ${user.email} (Role: ${user.role}) access denied: 2FA NOT ENABLED.`);
        throw new ForbiddenException(
          'Military Grade Security: Two-Factor Authentication (2FA) is mandatory for all administrative staff. Please enable it in your profile settings to access this area.',
        );
      }

      // 2. IP Consistency Check (Zero-Trust)
      // Extracts sessionId (sid) from JWT payload
      const sessionId = request.user.sid;
      if (sessionId) {
        const session = await this.prisma.userSession.findUnique({
          where: { id: sessionId },
        });

        // If session IP doesn't match current IP, revoke session immediately
        // Note: We allow minor IP changes for standard users, but NOT for Staff.
        if (session && session.ipAddress !== ip) {
          this.logger.warn(
            `MILITARY SECURITY BREACH: Admin ${user.email} IP mismatch. Session IP: ${session.ipAddress}, Current IP: ${ip}. Revoking session.`,
          );
          await this.prisma.userSession.delete({ where: { id: sessionId } });
          throw new ForbiddenException(
            'Military Grade Security: Session terminated due to IP address change. Please log in again using 2FA.',
          );
        }

        // 3. Device/Browser Consistency Check (Hardware Binding)
        if (session && session.device !== device) {
          this.logger.warn(
            `MILITARY SECURITY BREACH: Admin ${user.email} Device fingerprint changed. Revoking session.`,
          );
          await this.prisma.userSession.delete({ where: { id: sessionId } });
          throw new ForbiddenException(
            'Military Grade Security: Session terminated because a different device/browser was detected. Hard-binding enforced.',
          );
        }
      }
    }

    return true;
  }
}
