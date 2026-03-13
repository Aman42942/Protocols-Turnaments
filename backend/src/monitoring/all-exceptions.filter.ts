import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MonitoringService } from '../monitoring/monitoring.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private monitoringService: MonitoringService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Log critical errors (500s) to the monitoring system
    if (status >= 500) {
      const ip = request.ip || request.get('x-forwarded-for') || request.socket.remoteAddress;
      
      this.monitoringService.logSecurityEvent({
        type: 'SERVER_CRITICAL_ERROR',
        severity: 'HIGH',
        path: request.url,
        method: request.method,
        ipAddress: ip || 'Unknown',
        payload: {
          error: exception instanceof Error ? exception.message : 'Unknown Error',
          stack: exception instanceof Error ? exception.stack : null,
          status,
        },
      });
      
      this.monitoringService.incrementErrorCount();
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'object' ? (message as any).message : message,
    });
  }
}
