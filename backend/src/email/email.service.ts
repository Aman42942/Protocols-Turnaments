import { Injectable } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get('SMTP_PORT') || '587'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
      connectionTimeout: 5000, // Fail fast if SMTP is unreachable
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });
  }

  private async sendMail(to: string, subject: string, html: string) {
    const from =
      this.configService.get('SMTP_FROM') ||
      this.configService.get('SMTP_USER');
    try {
      // Use Promise.race to guarantee it never hangs indefinitely even if nodemailer fails to timeout
      await Promise.race([
        this.transporter.sendMail({ from, to, subject, html }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP Timeout Exceeded')), 6000))
      ]);
    } catch (error) {
      console.error('Email send error:', error);
      // Don't throw - email failure shouldn't block auth flow
    }
  }

  private baseTemplate(title: string, content: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#0a0a0f;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <!-- Header -->
        <div style="text-align:center;margin-bottom:30px;">
          <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:12px 24px;border-radius:12px;">
            <span style="color:white;font-size:24px;font-weight:bold;letter-spacing:2px;">🎮 PROTOCOL</span>
          </div>
        </div>
        
        <!-- Card -->
        <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid rgba(99,102,241,0.3);border-radius:16px;padding:40px;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
          <h1 style="color:#ffffff;font-size:24px;margin:0 0 10px 0;text-align:center;">${title}</h1>
          ${content}
        </div>
        
        <!-- Footer -->
        <div style="text-align:center;margin-top:30px;">
          <p style="color:#64748b;font-size:12px;margin:0;">
            © ${new Date().getFullYear()} Protocol Tournament. All rights reserved.
          </p>
          <p style="color:#475569;font-size:11px;margin:8px 0 0 0;">
            If you didn't request this email, you can safely ignore it.
          </p>
        </div>
      </div>
    </body>
    </html>`;
  }

  private renderTemplate(body: string, variables: Record<string, any>): string {
    let rendered = body;
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, variables[key]);
    });
    return rendered;
  }

  private async getTemplateOrFallback(key: string, variables: Record<string, any>, fallbackTitle: string, fallbackContent: string): Promise<{ subject: string; html: string }> {
    try {
      const template = await this.prisma.emailTemplate.findUnique({ where: { key } });
      if (template) {
        const body = this.renderTemplate(template.body, variables);
        return {
          subject: template.subject,
          html: this.baseTemplate(template.subject, body),
        };
      }
    } catch (error) {
      console.error(`Error fetching email template ${key}:`, error);
    }
    
    return {
      subject: fallbackTitle,
      html: this.baseTemplate(fallbackTitle, fallbackContent),
    };
  }

  // ========== PUBLIC GENERIC EMAIL (for queue processors) ==========

  async sendGenericEmail(to: string, subject: string, html: string) {
    await this.sendMail(to, subject, html);
  }

  // ========== EMAIL TEMPLATES ==========

  async sendVerificationCode(email: string, name: string, code: string) {
    const { subject, html } = await this.getTemplateOrFallback(
      'VERIFICATION_CODE',
      { name: name || 'Warrior', code },
      '🔑 Verify Your Email - Protocol Tournament',
      `
      <p style="color:#94a3b8;font-size:16px;text-align:center;margin:0 0 30px 0;">
        Welcome, <strong style="color:#e2e8f0;">${name || 'Warrior'}</strong>! Verify your email to start competing.
      </p>
      <div style="background:rgba(99,102,241,0.1);border:2px dashed rgba(99,102,241,0.4);border-radius:12px;padding:24px;text-align:center;margin:0 0 24px 0;">
        <p style="color:#94a3b8;font-size:14px;margin:0 0 8px 0;">Your verification code</p>
        <div style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#6366f1;font-family:'Courier New',monospace;">
          ${code}
        </div>
      </div>
      <p style="color:#64748b;font-size:13px;text-align:center;margin:0;">
        ⏱️ This code expires in <strong style="color:#f59e0b;">10 minutes</strong>
      </p>`,
    );

    await this.sendMail(email, subject, html);
  }

  async sendLoginOTP(email: string, name: string, code: string) {
    const { subject, html } = await this.getTemplateOrFallback(
      'LOGIN_OTP',
      { name: name || 'there', code },
      '🔐 Login Verification Code - Protocol Tournament',
      `
      <p style="color:#94a3b8;font-size:16px;text-align:center;margin:0 0 30px 0;">
        Hi <strong style="color:#e2e8f0;">${name || 'there'}</strong>, here's your login verification code.
      </p>
      <div style="background:rgba(34,197,94,0.1);border:2px dashed rgba(34,197,94,0.4);border-radius:12px;padding:24px;text-align:center;margin:0 0 24px 0;">
        <p style="color:#94a3b8;font-size:14px;margin:0 0 8px 0;">Login OTP</p>
        <div style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#22c55e;font-family:'Courier New',monospace;">
          ${code}
        </div>
      </div>`,
    );

    await this.sendMail(email, subject, html);
  }

  async sendWelcomeEmail(email: string, name: string) {
    const { subject, html } = await this.getTemplateOrFallback(
      'WELCOME_EMAIL',
      { name: name || 'Warrior' },
      '🎮 Welcome to Protocol Tournament!',
      `
      <p style="color:#94a3b8;font-size:16px;text-align:center;margin:0 0 30px 0;">
        🎉 Welcome to the arena, <strong style="color:#e2e8f0;">${name || 'Warrior'}</strong>!
      </p>
      <div style="text-align:center;margin:0 0 24px 0;">
        <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:12px 32px;border-radius:8px;font-size:16px;font-weight:bold;text-decoration:none;">
          Your Account is Ready ✅
        </div>
      </div>`,
    );

    await this.sendMail(email, subject, html);
  }

  async sendLoginAlert(email: string, name: string, ip: string, time: string) {
    const { subject, html } = await this.getTemplateOrFallback(
      'LOGIN_ALERT',
      { name: name || 'there', ip, time },
      '🔔 New Login Detected - Protocol Tournament',
      `
      <p style="color:#94a3b8;font-size:16px;text-align:center;margin:0 0 30px 0;">
        Hi <strong style="color:#e2e8f0;">${name || 'there'}</strong>, we detected a new login to your account.
      </p>
      <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:12px;padding:20px;margin:0 0 24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#64748b;padding:8px 0;font-size:14px;">📍 IP Address:</td>
            <td style="color:#e2e8f0;padding:8px 0;font-size:14px;text-align:right;font-family:monospace;">${ip || 'Unknown'}</td>
          </tr>
          <tr>
            <td style="color:#64748b;padding:8px 0;font-size:14px;">🕐 Time:</td>
            <td style="color:#e2e8f0;padding:8px 0;font-size:14px;text-align:right;">${time}</td>
          </tr>
        </table>
      </div>`,
    );

    await this.sendMail(email, subject, html);
  }

  async send2FAEnabledEmail(email: string, name: string) {
    const { subject, html } = await this.getTemplateOrFallback(
      'TWO_FACTOR_ENABLED',
      { name: name || 'Warrior' },
      '🛡️ 2FA Enabled - Protocol Tournament',
      `<p style="color:#94a3b8;font-size:16px;text-align:center;margin:0 0 20px 0;">
        <strong style="color:#e2e8f0;">${name || 'Warrior'}</strong>, Two-Factor Authentication has been enabled on your account.
      </p>`,
    );

    await this.sendMail(email, subject, html);
  }

  async sendAccountLockedEmail(email: string, name: string, minutesLocked: number) {
    const { subject, html } = await this.getTemplateOrFallback(
      'ACCOUNT_LOCKED',
      { name: name || 'there', minutes: minutesLocked },
      '🔒 Account Locked - Protocol Tournament',
      `<p style="color:#94a3b8;font-size:16px;text-align:center;margin:0 0 20px 0;">
        Hi <strong style="color:#e2e8f0;">${name || 'there'}</strong>, your account has been locked for ${minutesLocked} minutes.
      </p>`,
    );

    await this.sendMail(email, subject, html);
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const resetLink = `${(this.configService.get('FRONTEND_URL') || 'http://localhost:3000').replace(/\/$/, '')}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    const { subject, html } = await this.getTemplateOrFallback(
      'PASSWORD_RESET',
      { name: name || 'there', resetLink },
      '🔑 Reset Your Password - Protocol Tournament',
      `<p style="color:#94a3b8;font-size:16px;text-align:center;margin:0 0 20px 0;">
        Hi <strong style="color:#e2e8f0;">${name || 'there'}</strong>, click below to reset your password.
        <br><a href="${resetLink}">${resetLink}</a>
      </p>`,
    );

    await this.sendMail(email, subject, html);
  }

  async sendTournamentCreatedNotification(email: string, name: string, tournament: any) {
    const tournamentLink = `${(this.configService.get('FRONTEND_URL') || 'http://localhost:3000').replace(/\/$/, '')}/tournaments/${tournament.id}`;
    const formattedDate = new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(tournament.startDate));

    const { subject, html } = await this.getTemplateOrFallback(
      'TOURNAMENT_CREATED',
      { name: name || 'Warrior', title: tournament.title, game: tournament.game, prizePool: tournament.prizePool, entryFee: tournament.entryFee, date: formattedDate, tournamentLink },
      `🏆 New Tournament: ${tournament.title} is LIVE!`,
      `<p style="color:#ffffff;font-size:20px;margin:0 0 16px 0;text-align:center;">${tournament.title} is ready!</p>`,
    );

    await this.sendMail(email, subject, html);
  }

  async sendLoginSuccessEmail(email: string, name: string, ip: string, time: string) {
    const { subject, html } = await this.getTemplateOrFallback(
      'LOGIN_SUCCESS',
      { name: name || 'Warrior', ip, time },
      '🎮 Successful Login - Protocol Tournament',
      `<p>Welcome back, ${name}!</p>`,
    );

    await this.sendMail(email, subject, html);
  }

  async sendPasswordChangedEmail(email: string, name: string) {
    const { subject, html } = await this.getTemplateOrFallback(
      'PASSWORD_CHANGED',
      { name: name || 'there' },
      '🔐 Security Alert: Password Changed - Protocol Tournament',
      `<p>Your password was changed successfully.</p>`,
    );

    await this.sendMail(email, subject, html);
  }
}
