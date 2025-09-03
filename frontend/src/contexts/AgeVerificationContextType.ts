import { createContext } from 'react';

export interface AgeVerificationContextType {
  isVerified: boolean;
  isModalOpen: boolean;
  verifyAge: () => void;
  rejectAge: () => void;
  resetVerification: () => void;
}

export const AgeVerificationContext = createContext<AgeVerificationContextType | undefined>(undefined);