import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { SecurityService, SecurityEventType, SecuritySeverity } from './security.service';

@Injectable()
export class SecurityThrottlerGuard extends ThrottlerGuard {
    private readonly securityLogger = new Logger(SecurityThrottlerGuard.name);

    constructor(
        protected readonly options: any,
        protected readonly storageService: ThrottlerStorage,
        protected readonly reflector: Reflector,
        private readonly securityService: SecurityService,
    ) {
        super(options, storageService, reflector);
    }

    protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
        const request = context.switchToHttp().getRequest();
        const ip = request.ip || request.connection?.remoteAddress || 'UNKNOWN';
        const path = request.originalUrl;

        this.securityLogger.warn(`Rate Limit Exceeded for IP ${ip} at ${path}`);

        try {
            await this.securityService.logThreat({
                type: SecurityEventType.RATE_LIMIT,
                ipAddress: ip,
                userId: request.user?.id,
                path: path,
                method: request.method,
                severity: SecuritySeverity.MEDIUM,
            });
        } catch (e) {
            this.securityLogger.error('Failed to log rate limit threat', e);
        }

        throw new ThrottlerException('Too Many Requests. Your actions are being monitored.');
    }
}
