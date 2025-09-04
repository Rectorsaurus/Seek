import nodemailer from 'nodemailer';
import { IUser } from '../models/User';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter!: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor() {
    this.setupTransporter();
  }

  private setupTransporter() {
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // In development, create test account if no SMTP configured
    if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST) {
      nodemailer.createTestAccount().then((testAccount) => {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        this.isConfigured = true;
        console.log('📧 Email service configured with Ethereal test account');
        console.log('   User:', testAccount.user);
        console.log('   Pass:', testAccount.pass);
      });
      return;
    }

    this.transporter = nodemailer.createTransport(emailConfig);
    this.isConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

    if (this.isConfigured) {
      console.log('📧 Email service configured');
    } else {
      console.warn('⚠️  Email service not configured - emails will be logged only');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.isConfigured) {
        console.log('📧 Email would be sent to:', options.to);
        console.log('   Subject:', options.subject);
        console.log('   Content:', options.text || options.html);
        return true;
      }

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Seek'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@seek.com'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // Log preview URL for development
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Email sent:', info.messageId);
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  async sendVerificationEmail(user: IUser, verificationToken: string): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email - Seek</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50;">Seek</h1>
            <p style="color: #7f8c8d;">Pipe Tobacco Price Comparison</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Welcome to Seek, ${user.firstName}!</h2>
            <p>Thank you for registering with Seek. To complete your account setup, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            
            <p style="font-size: 14px; color: #7f8c8d;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #3498db;">${verificationUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; color: #7f8c8d; font-size: 12px;">
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with Seek, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
      Welcome to Seek, ${user.firstName}!
      
      Thank you for registering. Please verify your email address by visiting:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with Seek, you can safely ignore this email.
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email - Seek',
      html,
      text
    });
  }

  async sendPasswordResetEmail(user: IUser, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password - Seek</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50;">Seek</h1>
            <p style="color: #7f8c8d;">Pipe Tobacco Price Comparison</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Password Reset Request</h2>
            <p>Hello ${user.firstName},</p>
            <p>We received a request to reset your password for your Seek account. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #7f8c8d;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #e74c3c;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; color: #7f8c8d; font-size: 12px;">
            <p>This reset link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
      Password Reset Request
      
      Hello ${user.firstName},
      
      We received a request to reset your password. Visit this link to create a new password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, you can safely ignore this email.
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Reset Your Password - Seek',
      html,
      text
    });
  }

  async sendWelcomeEmail(user: IUser): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Seek!</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50;">Welcome to Seek!</h1>
            <p style="color: #7f8c8d;">Your account has been verified successfully</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Hello ${user.firstName},</h2>
            <p>Your email has been verified and your account is now active! You can now enjoy all the features of Seek:</p>
            
            <ul style="margin: 20px 0;">
              <li>Search and compare pipe tobacco prices across multiple retailers</li>
              <li>Track price changes and availability</li>
              <li>Discover new tobacco blends and brands</li>
              <li>Save your favorite products</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Start Exploring
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #7f8c8d; font-size: 12px;">
            <p>Happy searching!</p>
            <p>The Seek Team</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to Seek - Your Account is Ready!',
      html
    });
  }
}

export const emailService = new EmailService();