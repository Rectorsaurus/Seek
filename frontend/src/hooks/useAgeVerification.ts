import { useContext } from 'react';
import { AgeVerificationContext } from '../contexts/AgeVerificationContextType';

export function useAgeVerification() {
  const context = useContext(AgeVerificationContext);
  if (context === undefined) {
    throw new Error('useAgeVerification must be used within an AgeVerificationProvider');
  }
  return context;
}