import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MonitoringService } from '../monitoring/monitoring.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private monitoringService: MonitoringService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    this.monitoringService.incrementRequestCount(req.originalUrl);

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      if (res.statusCode >= 400) {
        this.monitoringService.incrementErrorCount();
      }

      // Check for suspicious patterns (simple example)
      if (duration > 5000 || res.statusCode === 401 || res.statusCode === 403) {
        const ip = req.ip || req.get('x-forwarded-for') || req.socket.remoteAddress;
        
        // Only log high latency or auth failures as suspicious if they happen frequently
        // For now, we just pass to monitoring service
        if (res.statusCode >= 500) {
           this.monitoringService.logSecurityEvent({
             type: 'SERVER_ERROR',
             severity: 'MEDIUM',
             path: req.originalUrl,
             method: req.method,
             ipAddress: ip || 'Unknown',
             payload: { statusCode: res.statusCode, duration }
           });
        }
      }
    });

    next();
  }
}
