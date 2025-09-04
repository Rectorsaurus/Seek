import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-access-denied">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>Authentication Required</h2>
            <p>Please log in to access this page.</p>
            <div style={{ marginTop: '20px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => window.location.reload()} // This will trigger the auth modal via header
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.emailVerified) {
    return (
      <div className="admin-email-verification">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>Email Verification Required</h2>
            <p>Please verify your email address to access admin features.</p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Check your email for a verification link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>Access Denied</h2>
            <p>You don't have permission to access this page.</p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              This page is restricted to administrators only.
            </p>
            <div style={{ marginTop: '20px' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => window.history.back()}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}