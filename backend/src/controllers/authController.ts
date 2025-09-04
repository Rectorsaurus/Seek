import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { User, IUser } from '../models/User';
import { AuthService } from '../middleware/auth';
import { emailService } from '../services/emailService';

// Rate limiting for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registration attempts per hour
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later'
  }
});

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
        return;
      }

      // Create new user
      const user = new User({
        email: email.toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'user',
        emailVerified: false
      });

      // Generate verification token
      const verificationToken = user.generateVerificationToken();
      await user.save();

      // Send verification email
      const emailSent = await emailService.sendVerificationEmail(user, verificationToken);
      if (!emailSent) {
        console.warn('Failed to send verification email to:', user.email);
      }

      res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        data: {
          userId: user._id,
          email: user.email,
          emailVerified: user.emailVerified
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.'
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const tokens = AuthService.generateTokenPair(user);
      AuthService.setTokenCookies(res, tokens);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          emailVerified: user.emailVerified
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      AuthService.clearTokenCookies(res);
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
        return;
      }

      const payload = AuthService.verifyRefreshToken(refreshToken);
      const user = await User.findById(payload.userId);

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Generate new tokens
      const tokens = AuthService.generateTokenPair(user);
      AuthService.setTokenCookies(res, tokens);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: user.toJSON()
        }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      AuthService.clearTokenCookies(res);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      const user = await User.findOne({ verificationToken: token });
      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
        return;
      }

      // Update user verification status
      user.emailVerified = true;
      user.set('verificationToken', undefined);
      await user.save();

      // Send welcome email
      await emailService.sendWelcomeEmail(user);

      res.json({
        success: true,
        message: 'Email verified successfully! Welcome to Seek.'
      });

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Email verification failed'
      });
    }
  }

  async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      if (user.emailVerified) {
        res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
        return;
      }

      // Generate new verification token
      const verificationToken = user.generateVerificationToken();
      await user.save();

      // Send verification email
      const emailSent = await emailService.sendVerificationEmail(user, verificationToken);
      if (!emailSent) {
        throw new Error('Failed to send email');
      }

      res.json({
        success: true,
        message: 'Verification email sent successfully'
      });

    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend verification email'
      });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Return success to prevent email enumeration
        res.json({
          success: true,
          message: 'If an account with that email exists, we\'ve sent a password reset link'
        });
        return;
      }

      // Generate reset token
      const resetToken = user.generateResetToken();
      await user.save();

      // Send reset email
      const emailSent = await emailService.sendPasswordResetEmail(user, resetToken);
      if (!emailSent) {
        console.warn('Failed to send password reset email to:', user.email);
      }

      res.json({
        success: true,
        message: 'If an account with that email exists, we\'ve sent a password reset link'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset request failed'
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      const user = await User.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: new Date() }
      });

      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
        return;
      }

      // Update password and clear reset token
      user.password = password;
      user.set('resetToken', undefined);
      user.set('resetTokenExpiry', undefined);
      await user.save();

      res.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset failed'
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: req.user.toJSON()
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile'
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { firstName, lastName, email, currentPassword, newPassword } = req.body;

      // If changing password, verify current password
      if (newPassword && currentPassword) {
        const isValidPassword = await req.user.comparePassword(currentPassword);
        if (!isValidPassword) {
          res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
          });
          return;
        }
        req.user.password = newPassword;
      }

      // Update other fields
      if (firstName) req.user.firstName = firstName.trim();
      if (lastName) req.user.lastName = lastName.trim();
      
      // If email is changed, require re-verification
      if (email && email.toLowerCase() !== req.user.email) {
        // Check if new email is already in use
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          res.status(400).json({
            success: false,
            message: 'Email is already in use'
          });
          return;
        }
        
        req.user.email = email.toLowerCase();
        req.user.emailVerified = false;
        const verificationToken = req.user.generateVerificationToken();
        
        // Send verification email to new address
        await emailService.sendVerificationEmail(req.user, verificationToken);
      }

      await req.user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: req.user.toJSON()
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Profile update failed'
      });
    }
  }

  async twitterCallback(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=twitter_auth_failed`);
      }

      // Generate tokens for Twitter user
      const tokens = AuthService.generateTokenPair(req.user as IUser);
      AuthService.setTokenCookies(res, tokens);

      // Redirect to frontend with success
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?twitter_auth=success`);
    } catch (error) {
      console.error('Twitter callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=twitter_auth_failed`);
    }
  }
}

export const authController = new AuthController();