import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { randomInt, randomBytes, createHash, randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_MINUTES = 15;
  private readonly logger = new Logger(AuthService.name);
  private readonly DISPOSABLE_DOMAINS = [
    'mailinator.com', 'temp-mail.org', 'tempmail.com', '10minutemail.com',
    'guerrillamail.com', 'sharklasers.com', 'dispostable.com', 'yopmail.com',
    'maildrop.cc', 'getnada.com', 'moakt.com', 'mytemp.email', 'dropmail.me',
    'fakeinbox.com', 'trashmail.com', 'disposable.com', 'fakemail.net'
  ];

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private walletService: WalletService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) { }

  // ========== HELPERS ==========

  private generateOTP(): string {
    // Use cryptographically secure random number generator
    return randomInt(100000, 999999).toString();
  }

  private isExpired(expiry: Date | null): boolean {
    if (!expiry) return true;
    return new Date() > new Date(expiry);
  }

  private isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    return this.DISPOSABLE_DOMAINS.includes(domain);
  }

  // ========== REGISTRATION ==========

  async register(createAuthDto: CreateAuthDto) {
    if (this.isDisposableEmail(createAuthDto.email)) {
      throw new BadRequestException(
        'Disposable email addresses are not allowed. Please use a permanent email provider (e.g. Gmail, Outlook).',
      );
    }

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
      bgmiId: (createAuthDto as any).ign || (createAuthDto as any).gameId, // Map to BGMI as default if not specified
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
    // 1. Update global revocation timestamp for JwtStrategy check
    await this.prisma.systemConfig.upsert({
      where: { key: 'REVOKE_BEFORE' },
      update: { value: now },
      create: { key: 'REVOKE_BEFORE', value: now },
    });

    // 2. Clear all refresh tokens in DB to force immediate re-authentication on next refresh
    await this.prisma.user.updateMany({
      where: {
        hashedRefreshToken: { not: null },
      },
      data: {
        hashedRefreshToken: null,
      },
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

    // Send welcome email & notification
    await this.emailService.sendWelcomeEmail(email, user.name || '');
    await this.emailService.sendLoginSuccessEmail(
      email,
      user.name || '',
      'System (Auto-verify)',
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    );

    // Auto-login after verification
    const { password, ...userWithoutPassword } = user;
    const tokens = await this.getTokens(
      userWithoutPassword.id,
      userWithoutPassword.email,
      userWithoutPassword.role,
      userWithoutPassword.name || undefined,
      'Unknown',
      'System Verification'
    );
    return {
      message: 'Email verified successfully!',
      verified: true,
      ...tokens,
      user: userWithoutPassword,
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

  async login(userOrBody: any, ip?: string, device?: string) {
    // If called from OAuth flow, user is already validated
    if (userOrBody.id) {
      const tokens = await this.getTokens(userOrBody.id, userOrBody.email, userOrBody.role, userOrBody.name, ip, device);
      const { password, ...userWithoutPassword } = userOrBody;
      return { ...tokens, user: userWithoutPassword };
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

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV ONLY] Login OTP for ${email}: ${otpCode}`);
    }
    await this.emailService.sendLoginOTP(email, user.name || '', otpCode);

    return {
      requiresOTP: true,
      email: user.email,
      message: 'A verification code has been sent to your email.',
    };
  }

  // ========== OTP VERIFICATION ==========

  async verifyLoginOTP(email: string, code: string, ip?: string, device?: string) {
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
    await this.emailService.sendLoginSuccessEmail(
      email,
      user.name || '',
      ip || 'Unknown',
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    );

    // Send notification
    await this.notificationsService.create(
      user.id,
      '✅ Login Successful',
      `You logged in from IP ${ip || 'Unknown'} at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      'info',
    );

    const { password, ...userWithoutPassword } = user;
    const tokens = await this.getTokens(
      userWithoutPassword.id,
      userWithoutPassword.email,
      userWithoutPassword.role,
      userWithoutPassword.name || undefined,
      ip,
      device
    );
    return { ...tokens, user: userWithoutPassword };
  }

  async resendLoginOTP(email: string) {
    const user = await this.usersService.findOne(email);
    if (!user) throw new BadRequestException('User not found');

    // cooldown check (60 seconds)
    if (user.otpExpiry) {
      const sentAt = user.otpExpiry.getTime() - 5 * 60 * 1000;
      const now = Date.now();
      if (now - sentAt < 60 * 1000) {
        const waitTime = Math.ceil((60 * 1000 - (now - sentAt)) / 1000);
        throw new BadRequestException(`Please wait ${waitTime} seconds before requesting a new OTP`);
      }
    }

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
      issuer: 'Protocol Tournament',
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
      issuer: 'Protocol Tournament',
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

  async validate2FA(email: string, code: string, ip?: string, device?: string) {
    const user = await this.usersService.findOne(email);
    if (!user) throw new BadRequestException('User not found');
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled');
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'Protocol Tournament',
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
    await this.emailService.sendLoginSuccessEmail(
      email,
      user.name || '',
      ip || 'Unknown',
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    );

    const { password, ...userWithoutPassword } = user;
    const tokens = await this.getTokens(
      userWithoutPassword.id,
      userWithoutPassword.email,
      userWithoutPassword.role,
      userWithoutPassword.name || undefined,
      ip,
      device
    );
    return { ...tokens, user: userWithoutPassword };
  }

  /**
   * Reusable TOTP verification (No side effects)
   */
  async verifyTOTP(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'Protocol Tournament',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
    });

    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  }


  async disable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled');
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'Protocol Tournament',
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

  private async generateTokens(userId: string, email: string, role: string, name?: string, sessionId?: string) {
    const payload = {
      sub: userId,
      email: email,
      role: role,
      name: name,
      sid: sessionId,
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!jwtSecret || !refreshSecret) {
      this.logger.error('CRITICAL: JWT secrets are missing in configuration!');
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'CATASTROPHIC FAILURE: Authentication secrets missing in production',
        );
      }
    }

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret || 'dev-only-insecure-secret',
        expiresIn: '1d',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret || 'dev-only-insecure-refresh-secret',
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async getTokens(userId: string, email: string, role: string, name?: string, ip?: string, device?: string) {
    const sessionId = randomUUID();
    const tokens = await this.generateTokens(userId, email, role, name, sessionId);
    const hash = await bcrypt.hash(tokens.refresh_token, 10);

    // Military Grade: Exclusive Sessions for ULTIMATE_ADMIN
    if (role === 'ULTIMATE_ADMIN') {
      await this.prisma.userSession.deleteMany({
        where: { userId: userId }
      });
    }

    await this.prisma.userSession.create({
      data: {
        id: sessionId,
        userId: userId,
        tokenHash: hash,
        ipAddress: ip || 'Unknown',
        device: device || 'Unknown Device',
        lastActive: new Date()
      }
    });

    // Military Grade: Admin Login Alerts
    if (role !== 'USER' && role !== 'EMPLOYEE') {
      try {
        await this.sendAdminLoginAlert(userId, role, ip || 'Unknown', device || 'Unknown Device');
      } catch (err) {
        console.error('Failed to send admin login alert email (SMTP Timeout):', err);
      }
    }

    return tokens;
  }

  private async sendAdminLoginAlert(userId: string, role: string, ip: string, device: string) {
    const owner = await this.prisma.user.findFirst({
      where: { role: 'ULTIMATE_ADMIN' }
    });

    const alertMessage = `MILITARY ALERT: Admin Account (${role}) logged in. 
    IP: ${ip}
    Device: ${device}
    Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
    Status: Monitoring session.`;

    // 1. In-app notification to Owner
    if (owner && owner.id !== userId) {
      await this.notificationsService.create(
        owner.id,
        '🚨 CRITICAL: Admin Login',
        alertMessage,
        'error'
      );
    }

    // 2. Notification to the signing-in user (as a warning)
    await this.notificationsService.create(
      userId,
      '🛡️ Security Notice',
      'You have logged into an administrative account. This session is being monitored under Military Grade Security protocols.',
      'warning'
    );
  }

  async refreshTokens(userId: string, refreshToken: string, sessionId: string) {
    if (!sessionId) throw new ForbiddenException('Invalid session');

    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });

    if (!session || session.userId !== userId) throw new ForbiddenException('Access Denied');

    const tokenMatches = await bcrypt.compare(refreshToken, session.tokenHash);
    if (!tokenMatches) throw new ForbiddenException('Access Denied');

    // Inactivity Timeout: 60 minutes
    const sixtyMinsAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (session.lastActive < sixtyMinsAgo) {
      await this.prisma.userSession.delete({ where: { id: sessionId } });
      throw new UnauthorizedException('Session expired due to inactivity. Please log in again.');
    }

    const tokens = await this.generateTokens(session.userId, session.user.email, session.user.role, session.user.name || undefined, sessionId);
    const hash = await bcrypt.hash(tokens.refresh_token, 10);

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { tokenHash: hash, lastActive: new Date() }
    });

    return tokens;
  }

  async logout(userId: string, sessionId?: string) {
    if (sessionId) {
      await this.prisma.userSession.deleteMany({
        where: { id: sessionId, userId }
      });
    }
  }

  // ========== OAUTH ==========

  async validateOAuthUser(profile: any): Promise<any> {
    let user = await this.usersService.findOne(profile.email);

    if (!user) {
      user = await this.usersService.create({
        email: profile.email,
        name: profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Social User',
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

    // Send Login Notification & Email for OAuth (Fire and forget to avoid blocking redirect)
    this.emailService.sendLoginSuccessEmail(
      user.email,
      user.name || '',
      'Google/OAuth',
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    );

    this.notificationsService.create(
      user.id,
      '✅ Login Successful',
      `You logged in via ${user.provider} at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      'info',
    );

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
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = createHash('sha256')
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

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV ONLY] Reset Token for ${email}: ${resetToken}`);
    }
    await this.emailService.sendPasswordResetEmail(
      email,
      user.name || '',
      resetToken,
    );

    return { message: 'If an account exists, a reset link has been sent.' };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    // Hash token to compare with DB
    const resetTokenHash = createHash('sha256')
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
      },
    });

    // Security: Kill ALL active sessions after password reset
    // This prevents attackers from maintaining access with stolen tokens
    await this.prisma.userSession.deleteMany({
      where: { userId: user.id },
    });
    this.logger.log(`[SECURITY] All sessions revoked for user ${user.email} after password reset`);

    // Send notification/email
    await this.emailService.sendPasswordChangedEmail(user.email, user.name || '');
    await this.notificationsService.create(
      user.id,
      '🔐 Password Changed',
      'Your account password was successfully updated.',
      'warning',
    );

    return { message: 'Password reset successfully. You can now login.' };
  }

  // ========== PASSWORD MANAGEMENT ==========

  async setPassword(userId: string, newPassword: string, currentPassword?: string) {
    if (newPassword.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }

    // Complexity check: must have at least one number or special character
    const hasComplexity = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
    if (!hasComplexity) {
      throw new BadRequestException(
        'Password must contain at least one number or special character',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // If the user already has a password, require verification of current password
    if (user.password && currentPassword) {
      const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentValid) {
        throw new BadRequestException('Current password is incorrect');
      }
    } else if (user.password && !currentPassword) {
      throw new BadRequestException('Current password is required to set a new password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Kill all other sessions for security
    await this.prisma.userSession.deleteMany({ where: { userId } });

    if (user) {
      await this.emailService.sendPasswordChangedEmail(user.email, user.name || '');
      await this.notificationsService.create(
        user.id,
        '🔐 Password Updated',
        'Your profile password has been successfully updated. All other sessions have been logged out.',
        'warning',
      );
    }

    return { message: 'Password set successfully. Please log in again.' };
  }
}
