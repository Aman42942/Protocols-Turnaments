import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { SecurityService, SecurityEventType, SecuritySeverity } from './security.service';

@Injectable()
export class GlobalSecurityGuard implements CanActivate {
    private readonly logger = new Logger(GlobalSecurityGuard.name);

    // Advanced Regex for detecting SQL Injection
    private readonly sqliRegex = new RegExp(
        /(?:'|"|`|;|--|\/\*|\*\/)|(?:\b(?:UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE|xp_cmdshell|sp_executesql)\b)/i
    );

    // Advanced Regex for detecting Cross-Site Scripting (XSS)
    private readonly xssRegex = new RegExp(
        /(?:<script.*?>.*?<\/script>|<.*?on\w+\s*=.*?>|javascript:|data:text\/html)/i
    );

    constructor(private readonly securityService: SecurityService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const ip = request.ip || request.connection?.remoteAddress || 'UNKNOWN';

        // 1. Fast Banned IP Check
        const isBanned = await this.securityService.isIpBanned(ip);
        if (isBanned) {
            const config = this.securityService.getBannedPageConfig();
            throw new ForbiddenException({
                message: config.message,
                title: config.title,
                banned: true,
                statusCode: 403,
                error: 'Forbidden'
            });
        }

        // --- WHITELIST ROUTES ---
        // Certain routes (like OAuth callbacks or webhooks) carry complex payloads (tokens, signatures)
        // that naturally trigger the strict WAF regex. We bypass deep inspection for these.
        const whitelistedPrefixes = [
            '/auth/google',
            '/payments/webhook',
            '/auth/set-password', // Passwords may contain SQLi/XSS-like characters by user intent
            '/users/me'           // Profile URLs/Bios may contain complex strings/links
        ];

        if (whitelistedPrefixes.some(prefix => request.originalUrl.startsWith(prefix))) {
            return true;
        }

        // 2. Deep Payload Inspection
        const payloadStr = this.serializePayload(request);
        if (!payloadStr) return true; // nothing to inspect

        // Check XSS
        if (this.xssRegex.test(payloadStr)) {
            await this.securityService.logThreat({
                type: SecurityEventType.XSS,
                ipAddress: ip,
                userId: request.user?.id,
                path: request.originalUrl,
                method: request.method,
                payload: payloadStr,
                severity: SecuritySeverity.CRITICAL,
            });
            throw new ForbiddenException('Malicious payload detected and blocked.');
        }

        // Check SQLi
        // We only strictly check SQLi in query string or strictly defined params because JSON bodies often contain harmless characters like quotes/semicolons.
        // The regex is quite aggressive, so we apply it primarily on the raw URL string or params.
        if (this.sqliRegex.test(request.originalUrl)) {
            await this.securityService.logThreat({
                type: SecurityEventType.SQLI,
                ipAddress: ip,
                userId: request.user?.id,
                path: request.originalUrl,
                method: request.method,
                payload: request.originalUrl,
                severity: SecuritySeverity.CRITICAL,
            });
            throw new ForbiddenException('Malicious query format detected and blocked.');
        }

        return true;
    }

    private serializePayload(request: any): string {
        const parts: string[] = [];
        if (request.body && typeof request.body === 'object') parts.push(JSON.stringify(request.body as Record<string, any>));
        if (request.query && typeof request.query === 'object') parts.push(JSON.stringify(request.query as Record<string, any>));
        if (request.params && typeof request.params === 'object') parts.push(JSON.stringify(request.params as Record<string, any>));
        return parts.join(' | ');
    }
}
