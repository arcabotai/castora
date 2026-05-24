'use client'

import { createContext, useContext, ReactNode } from 'react';
import { SignerApprovalDialog } from '@/components/auth/SignerApprovalDialog';

type SignerApprovalDialogContextType = {
  SignerApprovalDialogComponent: React.FC;
};

const SignerApprovalDialogContext = createContext<SignerApprovalDialogContextType | null>(null);

export const SignerApprovalDialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SignerApprovalDialogContext.Provider value={{
      SignerApprovalDialogComponent: SignerApprovalDialog
    }}>
      <SignerApprovalDialog />
      {children}
    </SignerApprovalDialogContext.Provider>
  );
};

export const useSignerApprovalDialog = () => {
  const context = useContext(SignerApprovalDialogContext);
  if (!context) {
    throw new Error('useSignerApprovalDialog must be used within a SignerApprovalDialogProvider');
  }
  return context;
}; 