import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RefreshTokenGuard } from './refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) { }

  // ========== REGISTRATION ==========

  @Post('register')
  async register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  // ========== EMAIL VERIFICATION ==========

  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string; code: string }) {
    return this.authService.verifyEmail(body.email, body.code);
  }

  @Post('resend-verification')
  async resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerification(body.email);
  }

  // ========== LOGIN ==========

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Req() req,
    @Res({ passthrough: true }) res,
  ) {
    const ip = req.headers['x-forwarded-for'] || req.ip || 'Unknown';
    const result = (await this.authService.login(body, ip)) as any;

    // Set HTTP-only cookie for Refresh Token if present
    if (result.refresh_token) {
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }

    return result;
  }

  // ========== REFRESH TOKEN ==========

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refresh(@Req() req, @Res({ passthrough: true }) res) {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    const tokens = await this.authService.refreshTokens(userId, refreshToken);

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return { access_token: tokens.access_token };
  }

  // ========== LOGOUT ==========

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req, @Res({ passthrough: true }) res) {
    await this.authService.logout(req.user['id'] || req.user['sub']);
    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }

  // ========== OTP VERIFICATION ==========

  @Post('verify-otp')
  async verifyOTP(
    @Body() body: { email: string; code: string },
    @Req() req,
    @Res({ passthrough: true }) res,
  ) {
    const ip = req.headers['x-forwarded-for'] || req.ip || 'Unknown';
    const result = (await this.authService.verifyLoginOTP(
      body.email,
      body.code,
      ip,
    )) as any;

    if (result.refresh_token) {
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }
    return result;
  }

  @Post('resend-otp')
  async resendOTP(@Body() body: { email: string }) {
    return this.authService.resendLoginOTP(body.email);
  }

  // ========== TWO-FACTOR AUTH ==========

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  async setup2FA(@Request() req) {
    return this.authService.setup2FA(req.user.id);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  async verify2FASetup(@Request() req, @Body() body: { code: string }) {
    return this.authService.verify2FASetup(req.user.id, body.code);
  }

  @Post('2fa/validate')
  async validate2FA(
    @Body() body: { email: string; code: string },
    @Req() req,
    @Res({ passthrough: true }) res,
  ) {
    const ip = req.headers['x-forwarded-for'] || req.ip || 'Unknown';
    const result = (await this.authService.validate2FA(
      body.email,
      body.code,
      ip,
    )) as any;

    if (result.refresh_token) {
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }
    return result;
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  async disable2FA(@Request() req, @Body() body: { code: string }) {
    return this.authService.disable2FA(req.user.id, body.code);
  }

  // ========== KILL SWITCH (SUPER ADMIN ONLY) ==========

  @Post('global-logout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  async globalLogout(@Req() req) {
    return this.authService.revokeAllSessions();
  }

  // ========== GOOGLE OAUTH ==========

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) { }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res({ passthrough: true }) res) {
    const tokens = (await this.authService.login(req.user)) as any;

    if (tokens.refresh_token) {
      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }

    const frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'
    ).replace(/\/$/, '');

    res.redirect(
      `${frontendUrl}/auth/callback?token=${tokens.access_token}&login=success`,
    );
  }

  // ========== FACEBOOK OAUTH ==========

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth(@Req() req) { }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthRedirect(@Req() req, @Res({ passthrough: true }) res) {
    const tokens = (await this.authService.login(req.user)) as any;

    if (tokens.refresh_token) {
      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }

    const frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'
    ).replace(/\/$/, '');

    res.redirect(
      `${frontendUrl}/auth/callback?token=${tokens.access_token}&login=success`,
    );
  }

  // ========== PASSWORD RESET ==========

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; token: string; newPassword: string },
  ) {
    return this.authService.resetPassword(
      body.email,
      body.token,
      body.newPassword,
    );
  }

  // ========== PASSWORD MANAGEMENT (Authenticated) ==========

  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  async setPassword(@Request() req, @Body() body: { password: string }) {
    return this.authService.setPassword(req.user.userId, body.password);
  }
}
