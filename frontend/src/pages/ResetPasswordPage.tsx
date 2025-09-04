import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const token = searchParams.get('token');

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
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  useEffect(() => {
    if (password) {
      validatePasswordStrength(password);
    }
  }, [password]);

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

  const validateForm = () => {
    if (!password) {
      setError('Password is required');
      return false;
    }

    if (passwordStrength.score < 5) {
      setError('Please ensure your password meets all requirements');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid reset link');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await resetPassword(token, password);
      if (result.success) {
        setIsSuccess(true);
        setMessage('Your password has been reset successfully! You can now log in with your new password.');
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(result.message || 'Password reset failed. The link may have expired.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="reset-password-page">
        <div className="container">
          <div className="reset-password-container">
            <div className="reset-password-card">
              <div className="error-icon">❌</div>
              <h1>Invalid Reset Link</h1>
              <p>This password reset link is invalid or has expired.</p>
              <div className="action-buttons">
                <Link to="/" className="btn btn-primary">
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="reset-password-page">
        <div className="container">
          <div className="reset-password-container">
            <div className="reset-password-card">
              <div className="success-icon">✅</div>
              <h1>Password Reset Successful</h1>
              <p className="message success">{message}</p>
              <p className="redirect-message">Redirecting you to home page...</p>
              <div className="action-buttons">
                <Link to="/" className="btn btn-primary">
                  Go to Home Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="container">
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="reset-password-header">
              <h1>Reset Your Password</h1>
              <p>Enter your new password below</p>
            </div>

            <form onSubmit={handleSubmit} className="reset-password-form">
              {error && (
                <div className="message error">{error}</div>
              )}

              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                
                {password && (
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

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary reset-submit-btn"
                disabled={isLoading || passwordStrength.score < 5}
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>

            <div className="help-links">
              <Link to="/" className="link-button">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}