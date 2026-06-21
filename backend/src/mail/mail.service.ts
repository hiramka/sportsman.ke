import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<string>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && port && user && pass) {
      try {
        const secure = this.configService.get<string>('SMTP_SECURE') === 'true';
        this.transporter = nodemailer.createTransport({
          host,
          port: parseInt(port, 10),
          secure,
          auth: {
            user,
            pass,
          },
        });
        this.isConfigured = true;
        this.logger.log('📧 MailService SMTP Transporter successfully initialized.');
      } catch (error) {
        this.logger.error('Failed to initialize nodemailer transporter:', error.stack);
      }
    } else {
      this.logger.warn(
        '⚠️ SMTP configurations are missing in environment variables. Falling back to terminal logs for verification link simulation.',
      );
    }
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
    const backendUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000';
    const verificationLink = `${backendUrl}/api/auth/verify?token=${token}`;
    const fromAddress = this.configService.get<string>('SMTP_FROM') || '"Sportman.ke" <noreply@sportman.ke>';

    // Beautiful premium dark theme HTML email matching Sportman.ke design
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your Sportman.ke Account</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: #080B11;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #E2E8F0;
            }
            .wrapper {
              width: 100%;
              table-layout: fixed;
              background-color: #080B11;
              padding-bottom: 40px;
              padding-top: 40px;
            }
            .main-table {
              background-color: #0D1321;
              margin: 0 auto;
              width: 100%;
              max-width: 600px;
              border-spacing: 0;
              border-radius: 16px;
              border: 1px solid rgba(255, 90, 31, 0.15);
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
              overflow: hidden;
            }
            .header {
              background-color: #0F172A;
              padding: 30px;
              text-align: center;
              border-bottom: 1px solid rgba(255, 90, 31, 0.1);
            }
            .logo {
              color: #FF5A1F;
              font-size: 26px;
              font-weight: 800;
              letter-spacing: 2px;
              margin: 0;
              text-transform: uppercase;
              text-decoration: none;
            }
            .content {
              padding: 40px 30px;
              line-height: 1.6;
            }
            h1 {
              color: #FFFFFF;
              font-size: 22px;
              font-weight: 700;
              margin-top: 0;
              margin-bottom: 20px;
            }
            p {
              color: #94A3B8;
              font-size: 15px;
              margin-bottom: 24px;
            }
            .button-container {
              text-align: center;
              margin: 35px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #FF5A1F 0%, #EF4444 100%);
              color: #FFFFFF !important;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 8px;
              font-weight: 750;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 1px;
              box-shadow: 0 4px 15px rgba(255, 90, 31, 0.3);
            }
            .link-fallback {
              background-color: #1E293B;
              border: 1px solid #334155;
              border-radius: 8px;
              padding: 15px;
              word-break: break-all;
              font-size: 12px;
              color: #FF5A1F;
              margin-top: 30px;
            }
            .link-title {
              font-weight: bold;
              color: #94A3B8;
              margin-bottom: 5px;
            }
            .footer {
              padding: 30px;
              text-align: center;
              background-color: #0F172A;
              border-top: 1px solid rgba(255, 255, 255, 0.05);
            }
            .footer-text {
              font-size: 12px;
              color: #64748B;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <table class="main-table">
              <tr>
                <td class="header">
                  <div class="logo">SPORTMAN<span style="color:#FFFFFF">.KE</span></div>
                </td>
              </tr>
              <tr>
                <td class="content">
                  <h1>Verify your Sportman.ke Account</h1>
                  <p>Hi ${name},</p>
                  <p>Thank you for registering on Sportman.ke! To complete your registration and activate your account, please click the button below to verify your email address:</p>
                  
                  <div class="button-container">
                    <a href="${verificationLink}" class="cta-button">Verify Email Address</a>
                  </div>
                  
                  <p>If you did not sign up for this account, please ignore this email.</p>
                  
                  <div class="link-fallback">
                    <div class="link-title">Or copy and paste this link in your browser:</div>
                    <a href="${verificationLink}" style="color: #FF5A1F; text-decoration: none;">${verificationLink}</a>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="footer">
                  <p class="footer-text">&copy; 2026 Sportman.ke. All rights reserved.</p>
                  <p class="footer-text" style="margin-top: 5px;">Nairobi, Kenya</p>
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `;

    if (this.isConfigured && this.transporter) {
      try {
        await this.transporter.sendMail({
          from: fromAddress,
          to: email,
          subject: 'Verify your Sportman.ke Account',
          html: htmlContent,
        });
        this.logger.log(`Verification email successfully sent to: ${email}`);
        return true;
      } catch (error) {
        this.logger.error(`Failed to send verification email via SMTP to ${email}:`, error.stack);
        // Fallback to printing in console if sending fails to avoid blocking the user flow
        this.logFallback(email, name, verificationLink);
        return false;
      }
    } else {
      this.logFallback(email, name, verificationLink);
      return false;
    }
  }

  private logFallback(email: string, name: string, verificationLink: string) {
    this.logger.log(`
=================== EMAIL VERIFICATION SIMULATOR ===================
To: ${email}
Subject: Verify your Sportman.ke Account

Hi ${name},
Thank you for registering. Please verify your email address by clicking:
${verificationLink}
====================================================================
    `);
  }
}
