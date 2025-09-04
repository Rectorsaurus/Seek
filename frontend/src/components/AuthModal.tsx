import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

type ValidationErrors = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  general?: string;
};

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { login, register, forgotPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState<string>('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    requirements: {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecial: false
    }
  });

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrors({});
      setMessage('');
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: ''
      });
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (mode === 'register' && formData.password) {
      validatePasswordStrength(formData.password);
    }
  }, [formData.password, mode]);

  const validatePasswordStrength = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[@$!%*?&]/.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;

    setPasswordStrength({ score, requirements });
  };

  const validateForm = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (mode === 'register') {
      if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
      } else if (!passwordStrength.requirements.hasUppercase) {
        errors.password = 'Password must contain at least one uppercase letter';
      } else if (!passwordStrength.requirements.hasLowercase) {
        errors.password = 'Password must contain at least one lowercase letter';
      } else if (!passwordStrength.requirements.hasNumber) {
        errors.password = 'Password must contain at least one number';
      } else if (!passwordStrength.requirements.hasSpecial) {
        errors.password = 'Password must contain at least one special character (@$!%*?&)';
      }
    }

    // Name validation for registration
    if (mode === 'register') {
      if (!formData.firstName.trim()) {
        errors.firstName = 'First name is required';
      } else if (formData.firstName.trim().length < 2) {
        errors.firstName = 'First name must be at least 2 characters long';
      }

      if (!formData.lastName.trim()) {
        errors.lastName = 'Last name is required';
      } else if (formData.lastName.trim().length < 2) {
        errors.lastName = 'Last name must be at least 2 characters long';
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setMessage('');

    try {
      if (mode === 'login') {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          if (!result.emailVerified) {
            setMessage('Please check your email and verify your account to continue.');
          } else {
            onClose();
          }
        } else {
          setErrors({ general: result.message || 'Login failed' });
        }
      } else {
        const result = await register(
          formData.email,
          formData.password,
          formData.firstName.trim(),
          formData.lastName.trim()
        );
        if (result.success) {
          setMessage(result.message || 'Registration successful! Please check your email to verify your account.');
          setMode('login');
        } else {
          setErrors({ general: result.message || 'Registration failed' });
        }
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTwitterLogin = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    window.location.href = `${API_BASE_URL}/auth/twitter`;
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return '#e74c3c';
    if (passwordStrength.score <= 3) return '#f39c12';
    if (passwordStrength.score <= 4) return '#27ae60';
    return '#2ecc71';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Fair';
    if (passwordStrength.score <= 4) return 'Good';
    return 'Strong';
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <button className="auth-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="auth-modal-body">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
              disabled={isLoading}
            >
              Login
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
              disabled={isLoading}
            >
              Sign Up
            </button>
          </div>

          {message && (
            <div className={`auth-message ${mode === 'register' ? 'success' : 'info'}`}>
              {message}
            </div>
          )}

          {errors.general && (
            <div className="auth-message error">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={errors.firstName ? 'error' : ''}
                      disabled={isLoading}
                    />
                    {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={errors.lastName ? 'error' : ''}
                      disabled={isLoading}
                    />
                    {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={errors.password ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
              
              {mode === 'register' && formData.password && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div 
                      className="password-strength-fill"
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    ></div>
                  </div>
                  <div className="password-strength-text">
                    Strength: <span style={{ color: getPasswordStrengthColor() }}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="password-requirements">
                    <div className={passwordStrength.requirements.minLength ? 'met' : 'unmet'}>
                      ✓ At least 8 characters
                    </div>
                    <div className={passwordStrength.requirements.hasUppercase ? 'met' : 'unmet'}>
                      ✓ One uppercase letter
                    </div>
                    <div className={passwordStrength.requirements.hasLowercase ? 'met' : 'unmet'}>
                      ✓ One lowercase letter
                    </div>
                    <div className={passwordStrength.requirements.hasNumber ? 'met' : 'unmet'}>
                      ✓ One number
                    </div>
                    <div className={passwordStrength.requirements.hasSpecial ? 'met' : 'unmet'}>
                      ✓ One special character (@$!%*?&)
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={isLoading || (mode === 'register' && passwordStrength.score < 5)}
            >
              {isLoading ? 'Please wait...' : (mode === 'login' ? 'Log In' : 'Create Account')}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button 
            className="auth-twitter-btn"
            onClick={handleTwitterLogin}
            disabled={isLoading}
          >
            <span className="twitter-icon">𝕏</span>
            Continue with X
          </button>

          {mode === 'login' && (
            <div className="auth-links">
              <button 
                type="button"
                className="link-button"
                onClick={async () => {
                  if (!formData.email) {
                    setErrors({ email: 'Please enter your email address first' });
                    return;
                  }
                  
                  setIsLoading(true);
                  const result = await forgotPassword(formData.email);
                  setIsLoading(false);
                  
                  if (result.success) {
                    setMessage('Password reset instructions have been sent to your email.');
                  } else {
                    setMessage(result.message || 'Failed to send reset email.');
                  }
                }}
                disabled={isLoading}
              >
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}