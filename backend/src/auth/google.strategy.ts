import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'placeholder',
      clientSecret:
        configService.get<string>('GOOGLE_CLIENT_SECRET') || 'placeholder',
      callbackURL: `${(configService.get<string>('API_URL') || 'http://localhost:4000').replace(/\/$/, '')}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos, id } = profile;
    const user = {
      email: emails && emails.length > 0 ? emails[0].value : null,
      firstName: name && name.givenName ? name.givenName : 'Unknown',
      lastName: name && name.familyName ? name.familyName : 'User',
      picture: photos && photos.length > 0 ? photos[0].value : '',
      accessToken,
      provider: 'GOOGLE',
      providerId: id,
    };

    if (!user.email) {
      console.error('No email found in Google Profile');
      return done(new Error('No email found from Google Login'), false);
    }

    console.log('Processed User for Auth:', user);

    try {
      // Validate or create user via AuthService
      const validatedUser = await this.authService.validateOAuthUser(user);
      done(null, validatedUser);
    } catch (error) {
      console.error('Error validating OAuth user:', error);
      done(error, false);
    }
  }
}
