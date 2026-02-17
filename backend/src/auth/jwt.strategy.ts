import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          return request?.cookies?.token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: any) {
    // Kill Switch: Check if token was issued before the global revocation time
    const minDate = await this.authService.getMinTokenDate();
    if (minDate && payload.iat) {
      const issuedAt = new Date(payload.iat * 1000); // JWT iat is in seconds
      if (issuedAt < minDate) {
        throw new UnauthorizedException('Session revoked. Please login again.');
      }
    }

    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
