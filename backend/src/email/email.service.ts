import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get('SMTP_PORT') || '587'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  private async sendMail(to: string, subject: string, html: string) {
    const from =
      this.configService.get('SMTP_FROM') ||
      this.configService.get('SMTP_USER');
    try {
      await this.transporter.sendMail({ from, to, subject, html });
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

  // ========== PUBLIC GENERIC EMAIL (for queue processors) ==========

  async sendGenericEmail(to: string, subject: string, html: string) {
    await this.sendMail(to, subject, html);
  }

  // ========== EMAIL TEMPLATES ==========

  async sendVerificationCode(email: string, name: string, code: string) {
    const content = `
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
      </p>`;

    await this.sendMail(
      email,
      '🔑 Verify Your Email - Protocol Tournament',
      this.baseTemplate('Email Verification', content),
    );
  }

  async sendLoginOTP(email: string, name: string, code: string) {
    const content = `
      <p style="color:#94a3b8;font-size:16px;text-align:center;margin:0 0 30px 0;">
        Hi <strong style="color:#e2e8f0;">${name || 'there'}</strong>, here's your login verification code.
      </p>
      <div style="background:rgba(34,197,94,0.1);border:2px dashed rgba(34,197,94,0.4);border-radius:12px;padding:24px;text-align:center;margin:0 0 24px 0;">
        <p style="color:#94a3b8;font-size:14px;margin:0 0 8px 0;">Login OTP</p>
        <div style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#22c55e;font-family:'Courier New',monospace;">
          ${code}
        </div>
      </div>
      <p style="color:#64748b;font-size:13px;text-align:center;margin:0;">
        ⏱️ This code expires in <strong style="color:#f59e0b;">5 minutes</strong>
      </p>
      <div style="background:rgba(239,68,68,0.1);border-radius:8px;padding:12px;margin-top:20px;">
        <p style="color:#ef4444;font-size:12px;text-align:center;margin:0;">
          🚨 If you didn't try to log in, someone may have your password. Change it immediately.
        </p>
      </div>`;

    await this.sendMail(
      email,
      '🔐 Login Verification Code - Protocol Tournament',
      this.baseTemplate('Login Verification', content),
    );
  }

  async sendWelcomeEmail(email: string, name: string) {
    const content = `
      <p style="color:#94a3b8;font-size:16px;text-align:center;margin:0 0 30px 0;">
        🎉 Welcome to the arena, <strong style="color:#e2e8f0;">${name || 'Warrior'}</strong>!
      </p>
      <div style="text-align:center;margin:0 0 24px 0;">
        <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:12px 32px;border-radius:8px;font-size:16px;font-weight:bold;text-decoration:none;">
          Your Account is Ready ✅
        </div>
      </div>
      <div style="border-top:1px solid rgba(99,102,241,0.2);padding-top:20px;margin-top:20px;">
        <p style="color:#94a3b8;font-size:14px;margin:0 0 12px 0;">Here's what you can do:</p>
        <ul style="color:#94a3b8;font-size:14px;padding-left:20px;">
          <li style="margin-bottom:8px;">🏆 Join tournaments and compete for prizes</li>
          <li style="margin-bottom:8px;">👥 Create or join teams</li>
          <li style="margin-bottom:8px;">💰 Win real money through your wallet</li>
          <li style="margin-bottom:8px;">🛡️ Enable Two-Factor Authentication for extra security</li>
        </ul>
      </div>`;

    await this.sendMail(
      email,
      '🎮 Welcome to Protocol Tournament!',
      this.baseTemplate('Welcome Aboard!', content),
    );
  }

  async sendLoginAlert(email: string, name: string, ip: string, time: string) {
    const content = `
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
      </div>
      <div style="background:rgba(239,68,68,0.1);border-radius:8px;padding:12px;">
        <p style="color:#ef4444;font-size:12px;text-align:center;margin:0;">
          🚨 If this wasn't you, change your password and enable 2FA immediately.
        </p>
      </div>`;

    await this.sendMail(
      email,
      '🔔 New Login Detected - Protocol Tournament',
      this.baseTemplate('Security Alert', content),
    );
  }

  async send2FAEnabledEmail(email: string, name: string) {
    const content = `
      <p style="color:#94a3b8;font-size:16px;text-align:center;margin:0 0 20px 0;">
        <strong style="color:#e2e8f0;">${name || 'Warrior'}</strong>, Two-Factor Authentication has been enabled on your account.
      </p>
      <div style="text-align:center;margin:20px 0;">
        <div style="display:inline-block;background:rgba(34,197,94,0.2);border:1px solid rgba(34,197,94,0.4);padding:16px 32px;border-radius:12px;">
          <span style="color:#22c55e;font-size:32px;">🛡️</span>
          <p style="color:#22c55e;font-weight:bold;margin:8px 0 0 0;">2FA is Active</p>
        </div>
      </div>
      <p style="color:#64748b;font-size:13px;text-align:center;margin:0;">
        You will now need your authenticator app to log in.
      </p>`;

    await this.sendMail(
      email,
      '🛡️ 2FA Enabled - Protocol Tournament',
      this.baseTemplate('2FA Enabled', content),
    );
  }

  async sendAccountLockedEmail(
    email: string,
    name: string,
    minutesLocked: number,
  ) {
    const content = `
      <p style="color:#94a3b8;font-size:16px;text-align:center;margin:0 0 20px 0;">
        Hi <strong style="color:#e2e8f0;">${name || 'there'}</strong>,
      </p>
      <div style="text-align:center;margin:20px 0;">
        <div style="display:inline-block;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);padding:16px 32px;border-radius:12px;">
          <span style="color:#ef4444;font-size:32px;">🔒</span>
          <p style="color:#ef4444;font-weight:bold;margin:8px 0 0 0;">Account Temporarily Locked</p>
        </div>
      </div>
      <p style="color:#94a3b8;font-size:14px;text-align:center;margin:20px 0;">
        Due to multiple failed login attempts, your account has been locked for <strong style="color:#f59e0b;">${minutesLocked} minutes</strong>.
      </p>
      <p style="color:#64748b;font-size:13px;text-align:center;margin:0;">
        If this wasn't you, someone may be trying to access your account. Consider changing your password and enabling 2FA.
      </p>`;

    await this.sendMail(
      email,
      '🔒 Account Locked - Protocol Tournament',
      this.baseTemplate('Account Locked', content),
    );
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const resetLink = `${(this.configService.get('FRONTEND_URL') || 'http://localhost:3000').replace(/\/$/, '')}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    const content = `
      <p style="color:#94a3b8;font-size:16px;text-align:center;margin:0 0 20px 0;">
        Hi <strong style="color:#e2e8f0;">${name || 'there'}</strong>,
      </p>
      <p style="color:#94a3b8;font-size:14px;text-align:center;margin:0 0 24px 0;">
        We received a request to reset your password. Click the button below to proceed.
      </p>
      <div style="text-align:center;margin:30px 0;">
        <a href="${resetLink}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;text-decoration:none;display:inline-block;box-shadow:0 10px 20px rgba(99,102,241,0.3);">
          Reset Password
        </a>
      </div>
      <p style="color:#64748b;font-size:13px;text-align:center;margin:24px 0 0 0;">
        If the button doesn't work, copy and paste this link:<br>
        <span style="color:#475569;word-break:break-all;">${resetLink}</span>
      </p>
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:24px 0 0 0;">
        This link expires in <strong style="color:#f59e0b;">15 minutes</strong>.
      </p>
      <div style="background:rgba(239,68,68,0.1);border-radius:8px;padding:12px;margin-top:20px;">
        <p style="color:#ef4444;font-size:12px;text-align:center;margin:0;">
          🚨 If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>`;

    await this.sendMail(
      email,
      '🔑 Reset Your Password - Protocol Tournament',
      this.baseTemplate('Password Reset', content),
    );
  }
}
