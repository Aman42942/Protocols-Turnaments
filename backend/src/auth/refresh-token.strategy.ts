import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
    Strategy,
    'jwt-refresh',
) {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => {
                    let data = request?.cookies['refresh_token'];
                    if (!data) {
                        return null;
                    }
                    return data;
                },
            ]),
            secretOrKey: config.get<string>('JWT_REFRESH_SECRET') || 'super-secret-refresh-key', // Fallback for dev
            passReqToCallback: true,
        });
    }

    validate(req: Request, payload: any) {
        const refreshToken = req.cookies['refresh_token'];
        if (!refreshToken) throw new UnauthorizedException();
        return { ...payload, refreshToken };
    }
}
