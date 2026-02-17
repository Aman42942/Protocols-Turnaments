import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      clientID:
        configService.get<string>('FACEBOOK_CLIENT_ID') || 'placeholder',
      clientSecret:
        configService.get<string>('FACEBOOK_CLIENT_SECRET') || 'placeholder',
      callbackURL: `${(configService.get<string>('API_URL') || 'http://localhost:4000').replace(/\/$/, '')}/auth/facebook/callback`,
      scope: ['email', 'public_profile'],
      profileFields: ['emails', 'name', 'picture.type(large)'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { name, emails, photos, id } = profile;

    const user = {
      email:
        emails && emails[0] ? emails[0].value : `facebook_${id}@example.com`,
      firstName: name && name.givenName ? name.givenName : 'Facebook',
      lastName: name && name.familyName ? name.familyName : 'User',
      picture: photos && photos[0] ? photos[0].value : '',
      accessToken,
      provider: 'FACEBOOK',
      providerId: id,
    };

    try {
      const validatedUser = await this.authService.validateOAuthUser(user);
      done(null, validatedUser);
    } catch (error) {
      done(error, false);
    }
  }
}
