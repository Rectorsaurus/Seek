import express from 'express';
import passport from '../config/passport';
import { authController, authRateLimit, registerRateLimit } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../validators/authValidators';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  updateProfileSchema
} from '../validators/authValidators';

const router = express.Router();

// Root route - provides information about available endpoints
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API endpoints',
    endpoints: {
      public: [
        'POST /api/auth/register',
        'POST /api/auth/login', 
        'POST /api/auth/logout',
        'POST /api/auth/refresh-token',
        'POST /api/auth/verify-email',
        'POST /api/auth/resend-verification',
        'POST /api/auth/forgot-password',
        'POST /api/auth/reset-password',
        'GET /api/auth/twitter',
        'GET /api/auth/twitter/callback'
      ],
      protected: [
        'GET /api/auth/profile',
        'PUT /api/auth/profile'
      ]
    }
  });
});

// Public routes
router.post('/register', 
  registerRateLimit, 
  validate(registerSchema), 
  authController.register
);

router.post('/login', 
  authRateLimit, 
  validate(loginSchema), 
  authController.login
);

router.post('/logout', authController.logout);

router.post('/refresh-token', authController.refreshToken);

router.post('/verify-email', 
  validate(verifyEmailSchema), 
  authController.verifyEmail
);

router.post('/resend-verification', 
  authRateLimit,
  validate(resendVerificationSchema), 
  authController.resendVerification
);

router.post('/forgot-password', 
  authRateLimit,
  validate(forgotPasswordSchema), 
  authController.forgotPassword
);

router.post('/reset-password', 
  validate(resetPasswordSchema), 
  authController.resetPassword
);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);

router.put('/profile', 
  authenticateToken,
  validate(updateProfileSchema), 
  authController.updateProfile
);

// Twitter OAuth routes - only if configured
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  router.get('/twitter', 
    passport.authenticate('twitter')
  );

  router.get('/twitter/callback',
    passport.authenticate('twitter', { 
      failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=twitter_auth_failed`,
      session: false 
    }),
    authController.twitterCallback
  );
} else {
  // Placeholder routes when Twitter OAuth is not configured
  router.get('/twitter', (req, res) => {
    res.status(501).json({ 
      success: false, 
      message: 'Twitter OAuth not configured' 
    });
  });

  router.get('/twitter/callback', (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=twitter_not_configured`);
  });
}

export default router;