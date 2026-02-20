import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import { CreateAuthDto } from './dto/create-auth.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_MINUTES = 15;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private walletService: WalletService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) { }

  // ========== HELPERS ==========

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private isExpired(expiry: Date | null): boolean {
    if (!expiry) return true;
    return new Date() > new Date(expiry);
  }

  // ========== REGISTRATION ==========

  async register(createAuthDto: CreateAuthDto) {
    // Password policy: min 8 chars
    if (!createAuthDto.password || createAuthDto.password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }

    const hashedPassword = await bcrypt.hash(createAuthDto.password, 10);
    const verifyCode = this.generateOTP();
    const verifyExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await this.usersService.create({
      email: createAuthDto.email,
      password: hashedPassword,
      name: createAuthDto.name,
      role: 'USER',
      emailVerified: false,
      emailVerifyCode: verifyCode,
      emailVerifyExpiry: verifyExpiry,
    });

    // Auto-create wallet for the new user
    await this.walletService.getWallet(user.id);
    // Send welcome notification
    await this.notificationsService.sendWelcome(user.id);
    // Send verification email
    await this.emailService.sendVerificationCode(
      user.email,
      user.name || '',
      verifyCode,
    );

    return {
      message:
        'Registration successful! Please check your email for verification code.',
      requiresVerification: true,
      email: user.email,
    };
  }

  // ========== KILL SWITCH (GLOBAL REVOCATION) ==========

  async revokeAllSessions() {
    const now = new Date().toISOString();
    await this.prisma.systemConfig.upsert({
      where: { key: 'REVOKE_BEFORE' },
      update: { value: now },
      create: { key: 'REVOKE_BEFORE', value: now },
    });
    return {
      message: 'All active sessions have been revoked. Users must re-login.',
    };
  }

  async getMinTokenDate(): Promise<Date | null> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: 'REVOKE_BEFORE' },
    });
    return config ? new Date(config.value) : null;
  }

  // ========== EMAIL VERIFICATION ==========

  async verifyEmail(email: string, code: string) {
    const user = await this.usersService.findOne(email);
    if (!user) throw new BadRequestException('User not found');
    if (user.emailVerified)
      return { message: 'Email already verified', verified: true };

    if (user.emailVerifyCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }
    if (this.isExpired(user.emailVerifyExpiry)) {
      throw new BadRequestException(
        'Verification code has expired. Please request a new one.',
      );
    }

    await this.prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        emailVerifyCode: null,
        emailVerifyExpiry: null,
      },
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(email, user.name || '');

    // Auto-login after verification
    const { password, ...userWithoutPassword } = user;
    return {
      message: 'Email verified successfully!',
      verified: true,
      ...(await this.getTokens(userWithoutPassword.id, userWithoutPassword.email, userWithoutPassword.role)),
    };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findOne(email);
    if (!user) throw new BadRequestException('User not found');
    if (user.emailVerified) return { message: 'Email already verified' };

    const verifyCode = this.generateOTP();
    const verifyExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { email },
      data: {
        emailVerifyCode: verifyCode,
        emailVerifyExpiry: verifyExpiry,
      },
    });

    await this.emailService.sendVerificationCode(
      email,
      user.name || '',
      verifyCode,
    );
    return { message: 'Verification code sent to your email' };
  }

  // ========== LOGIN ==========

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(userOrBody: any, ip?: string) {
    // If called from OAuth flow, user is already validated
    if (userOrBody.id) {
      return this.getTokens(userOrBody.id, userOrBody.email, userOrBody.role);
    }

    const { email, password } = userOrBody;
    const user = await this.usersService.findOne(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account lockout
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      const minutesLeft = Math.ceil(
        (new Date(user.lockedUntil).getTime() - Date.now()) / 60000,
      );
      throw new ForbiddenException(
        `Account locked. Try again in ${minutesLeft} minutes.`,
      );
    }

    // Validate password
    if (!user.password || !(await bcrypt.compare(password, user.password))) {
      // Increment login attempts
      const attempts = (user.loginAttempts || 0) + 1;
      const updateData: any = { loginAttempts: attempts };

      if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(
          Date.now() + this.LOCKOUT_MINUTES * 60 * 1000,
        );
        await this.emailService.sendAccountLockedEmail(
          email,
          user.name || '',
          this.LOCKOUT_MINUTES,
        );
      }

      await this.prisma.user.update({
        where: { email },
        data: updateData,
      });

      if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
        throw new ForbiddenException(
          `Account locked due to too many failed attempts. Try again in ${this.LOCKOUT_MINUTES} minutes.`,
        );
      }

      throw new UnauthorizedException(
        `Invalid credentials. ${this.MAX_LOGIN_ATTEMPTS - attempts} attempts remaining.`,
      );
    }

    // Check email verification
    if (
      !user.emailVerified &&
      user.provider !== 'GOOGLE' &&
      user.provider !== 'FACEBOOK'
    ) {
      // Resend verification code
      await this.resendVerification(email);
      return {
        requiresVerification: true,
        email: user.email,
        message: 'Please verify your email first. A new code has been sent.',
      };
    }

    // Reset login attempts on successful password
    await this.prisma.user.update({
      where: { email },
      data: { loginAttempts: 0, lockedUntil: null },
    });

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return {
        requires2FA: true,
        email: user.email,
        message: 'Please enter your 2FA code from authenticator app.',
      };
    }

    // Generate and send login OTP
    const otpCode = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.user.update({
      where: { email },
      data: { otpCode, otpExpiry },
    });

    console.log(`[DEV ONLY] Login OTP for ${email}: ${otpCode}`); // Log OTP for dev convenience
    await this.emailService.sendLoginOTP(email, user.name || '', otpCode);

    return {
      requiresOTP: true,
      email: user.email,
      message: 'A verification code has been sent to your email.',
    };
  }

  // ========== OTP VERIFICATION ==========

  async verifyLoginOTP(email: string, code: string, ip?: string) {
    const user = await this.usersService.findOne(email);
    if (!user) throw new BadRequestException('User not found');

    if (user.otpCode !== code) {
      throw new BadRequestException('Invalid OTP code');
    }
    if (this.isExpired(user.otpExpiry)) {
      throw new BadRequestException('OTP has expired. Please login again.');
    }

    // Clear OTP and update login tracking
    await this.prisma.user.update({
      where: { email },
      data: {
        otpCode: null,
        otpExpiry: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip || null,
        loginAttempts: 0,
      },
    });

    // Send login alert email
    await this.emailService.sendLoginAlert(
      email,
      user.name || '',
      ip || 'Unknown',
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    );

    // Send notification
    await this.notificationsService.create(
      user.id,
      '🔐 New Login',
      `You logged in from IP ${ip || 'Unknown'} at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      'info',
    );

    const { password, ...userWithoutPassword } = user;
    return this.getTokens(userWithoutPassword.id, userWithoutPassword.email, userWithoutPassword.role);
  }

  async resendLoginOTP(email: string) {
    const user = await this.usersService.findOne(email);
    if (!user) throw new BadRequestException('User not found');

    const otpCode = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.user.update({
      where: { email },
      data: { otpCode, otpExpiry },
    });

    await this.emailService.sendLoginOTP(email, user.name || '', otpCode);
    return { message: 'New OTP sent to your email' };
  }

  // ========== TWO-FACTOR AUTH ==========

  async setup2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (user.twoFactorEnabled)
      throw new BadRequestException('2FA is already enabled');

    const totp = new OTPAuth.TOTP({
      issuer: 'Protocal Tournament',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: new OTPAuth.Secret({ size: 20 }),
    });

    const secret = totp.secret.base32;
    const otpauthUrl = totp.toString();

    // Save secret temporarily (not enabled yet until verified)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    return {
      secret,
      qrCode,
      message:
        'Scan the QR code with Google Authenticator or Authy, then verify with a code.',
    };
  }

  async verify2FASetup(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (!user.twoFactorSecret)
      throw new BadRequestException('2FA setup not initiated');

    const totp = new OTPAuth.TOTP({
      issuer: 'Protocal Tournament',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      throw new BadRequestException('Invalid 2FA code. Please try again.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    await this.emailService.send2FAEnabledEmail(user.email, user.name || '');
    await this.notificationsService.create(
      userId,
      '🛡️ 2FA Enabled',
      'Two-Factor Authentication has been enabled on your account.',
      'success',
    );

    return { message: '2FA enabled successfully!', enabled: true };
  }

  async validate2FA(email: string, code: string, ip?: string) {
    const user = await this.usersService.findOne(email);
    if (!user) throw new BadRequestException('User not found');
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled');
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'Protocal Tournament',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Update login tracking
    await this.prisma.user.update({
      where: { email },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip || null,
        loginAttempts: 0,
      },
    });

    // Send login alert
    await this.emailService.sendLoginAlert(
      email,
      user.name || '',
      ip || 'Unknown',
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    );

    const { password, ...userWithoutPassword } = user;
    return this.getTokens(userWithoutPassword.id, userWithoutPassword.email, userWithoutPassword.role);
  }

  async disable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled');
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'Protocal Tournament',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      throw new BadRequestException('Invalid 2FA code. Cannot disable.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return { message: '2FA has been disabled', enabled: false };
  }

  // ========== TOKEN GENERATION ==========

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = {
      sub: userId,
      email: email,
      role: role,
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'super-secret',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh',
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRefreshToken: hash,
      },
    });
  }

  async getTokens(userId: string, email: string, role: string) {
    const tokens = await this.generateTokens(userId, email, role);
    await this.updateRefreshToken(userId, tokens.refresh_token);
    return tokens;
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user || !user.hashedRefreshToken)
      throw new ForbiddenException('Access Denied');

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!tokenMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRefreshToken: {
          not: null,
        },
      },
      data: {
        hashedRefreshToken: null,
      },
    });
  }

  // ========== OAUTH ==========

  async validateOAuthUser(profile: any): Promise<any> {
    let user = await this.usersService.findOne(profile.email);

    if (!user) {
      user = await this.usersService.create({
        email: profile.email,
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        avatar: profile.picture,
        password: '',
        role: 'USER',
        provider: profile.provider,
        providerId: profile.providerId,
        emailVerified: true, // OAuth emails are pre-verified
      } as any);

      await this.walletService.getWallet(user.id);
      await this.notificationsService.sendWelcome(user.id);
      await this.emailService.sendWelcomeEmail(profile.email, user.name || '');
    }

    // Update login tracking
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return user;
  }

  // ========== PASSWORD RESET ==========

  async forgotPassword(email: string) {
    const user = await this.usersService.findOne(email);
    if (!user) {
      // Don't reveal user existence
      return { message: 'If an account exists, a reset link has been sent.' };
    }

    // Generate token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenHash = require('crypto')
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.prisma.user.update({
      where: { email },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry,
      },
    });

    console.log(`[DEV ONLY] Reset Token for ${email}: ${resetToken}`); // Log for dev
    await this.emailService.sendPasswordResetEmail(
      email,
      user.name || '',
      resetToken,
    );

    return { message: 'If an account exists, a reset link has been sent.' };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    // Hash token to compare with DB
    const resetTokenHash = require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        email,
        resetToken: resetTokenHash,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        loginAttempts: 0,
        lockedUntil: null,
        // Optional: Logout all other sessions (kill switch logic on individual level)
        // But we don't track session IDs per se, relying on JWT expiry.
        // Changing password doesn't invalidate old JWTs unless we use a "token version" system.
        // For now, this is acceptable.
      },
    });

    // Send notification/email? (Optional)

    return { message: 'Password reset successfully. You can now login.' };
  }

  // ========== PASSWORD MANAGEMENT ==========

  async setPassword(userId: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      message:
        'Password updated successfully. You can now login with email/password.',
    };
  }
}
