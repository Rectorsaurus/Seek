import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { verifyEmail, resendVerification } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
      return;
    }

    const verifyToken = async () => {
      try {
        const result = await verifyEmail(token);
        if (result.success) {
          setStatus('success');
          setMessage(result.message || 'Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(result.message || 'Verification failed. The link may have expired.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyToken();
  }, [token, verifyEmail]);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address.');
      return;
    }

    setResending(true);
    try {
      const result = await resendVerification(email);
      if (result.success) {
        setMessage('A new verification email has been sent to your email address.');
      } else {
        setMessage(result.message || 'Failed to send verification email.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-email-page">
      <div className="container">
        <div className="verify-email-container">
          <div className="verify-email-card">
            <div className="verify-email-header">
              {status === 'loading' && (
                <>
                  <div className="loading-spinner"></div>
                  <h1>Verifying Your Email</h1>
                </>
              )}
              {status === 'success' && (
                <>
                  <div className="success-icon">✅</div>
                  <h1>Email Verified!</h1>
                </>
              )}
              {status === 'error' && (
                <>
                  <div className="error-icon">❌</div>
                  <h1>Verification Failed</h1>
                </>
              )}
            </div>

            <div className="verify-email-content">
              <p className={`message ${status}`}>{message}</p>

              {status === 'success' && (
                <div className="success-actions">
                  <p>You can now access all features of Seek!</p>
                  <div className="action-buttons">
                    <Link to="/" className="btn btn-primary">
                      Go to Home
                    </Link>
                    <Link to="/search" className="btn btn-secondary">
                      Start Searching
                    </Link>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="error-actions">
                  <h3>Need a new verification link?</h3>
                  <p>Enter your email address and we'll send you a new verification link:</p>
                  
                  <form onSubmit={handleResendVerification} className="resend-form">
                    <div className="form-group">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                        disabled={resending}
                      />
                    </div>
                    <div className="form-actions">
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={resending}
                      >
                        {resending ? 'Sending...' : 'Send New Verification Email'}
                      </button>
                    </div>
                  </form>

                  <div className="help-links">
                    <Link to="/" className="link-button">
                      Return to Home
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}