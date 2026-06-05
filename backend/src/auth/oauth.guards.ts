import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status: any) {
    if (err || !user) {
      const errorMsg = err?.message || info?.message || 'Google Authentication failed';
      console.error('💥 Google OAuth Guard Error:', err || info);
      throw new UnauthorizedException(errorMsg);
    }
    return user;
  }
}

@Injectable()
export class FacebookOAuthGuard extends AuthGuard('facebook') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status: any) {
    if (err || !user) {
      const errorMsg = err?.message || info?.message || 'Facebook Authentication failed';
      console.error('💥 Facebook OAuth Guard Error:', err || info);
      throw new UnauthorizedException(errorMsg);
    }
    return user;
  }
}
