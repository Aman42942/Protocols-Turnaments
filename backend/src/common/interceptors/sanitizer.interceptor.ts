import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SanitizerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body) {
      request.body = this.sanitize(request.body);
    }

    return next.handle();
  }

  private sanitize(data: any): any {
    if (typeof data === 'string') {
      // Basic XSS Sanitization: Remove script tags and onEvent handlers
      return data
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
        .replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gim, '')
        .replace(/javascript:[^\s]*/gim, '')
        .trim();
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitizedObj = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          sanitizedObj[key] = this.sanitize(data[key]);
        }
      }
      return sanitizedObj;
    }

    return data;
  }
}
