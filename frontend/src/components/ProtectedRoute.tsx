import { ReactNode } from 'react';
import { useAgeVerification } from '../hooks/useAgeVerification';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isVerified } = useAgeVerification();

  if (!isVerified) {
    return (
      <div className="age-restriction-placeholder">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>Age Verification Required</h2>
            <p>Please verify your age to view tobacco product information.</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}