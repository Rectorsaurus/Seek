import { useState, useEffect, ReactNode } from 'react';
import { AgeVerificationContext } from './AgeVerificationContextType';

const AGE_VERIFICATION_KEY = 'seek_age_verified';
const SESSION_KEY = 'seek_session_id';

interface AgeVerificationProviderProps {
  children: ReactNode;
}

export function AgeVerificationProvider({ children }: AgeVerificationProviderProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const checkAgeVerification = () => {
      const storedVerification = localStorage.getItem(AGE_VERIFICATION_KEY);
      const storedSession = sessionStorage.getItem(SESSION_KEY);
      
      if (storedVerification === 'true' && storedSession) {
        setIsVerified(true);
        setIsModalOpen(false);
      } else {
        setIsVerified(false);
        setIsModalOpen(true);
        // Generate new session ID
        sessionStorage.setItem(SESSION_KEY, Date.now().toString());
      }
    };

    checkAgeVerification();
  }, []);

  const verifyAge = () => {
    setIsVerified(true);
    setIsModalOpen(false);
    localStorage.setItem(AGE_VERIFICATION_KEY, 'true');
    sessionStorage.setItem(SESSION_KEY, Date.now().toString());
  };

  const rejectAge = () => {
    setIsVerified(false);
    setIsModalOpen(false);
    localStorage.removeItem(AGE_VERIFICATION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    
    // Redirect to a safe page or show rejection message
    window.location.href = 'https://www.cdc.gov/tobacco/basic_information/health_effects/index.htm';
  };

  const resetVerification = () => {
    setIsVerified(false);
    setIsModalOpen(true);
    localStorage.removeItem(AGE_VERIFICATION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const value = {
    isVerified,
    isModalOpen,
    verifyAge,
    rejectAge,
    resetVerification,
  };

  return (
    <AgeVerificationContext.Provider value={value}>
      {children}
    </AgeVerificationContext.Provider>
  );
}