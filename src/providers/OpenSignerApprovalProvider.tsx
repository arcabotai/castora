'use client'

import { createContext, useContext, useState, ReactNode } from 'react';

type OpenSignerApprovalContextType = {
  openSignerApproval: boolean;
  setOpenSignerApproval: (open: boolean) => void;
};

const OpenSignerApprovalContext = createContext<OpenSignerApprovalContextType | null>(null);

export const OpenSignerApprovalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [openSignerApproval, setOpenSignerApproval] = useState<boolean>(false);

  return (
    <OpenSignerApprovalContext.Provider value={{
      openSignerApproval,
      setOpenSignerApproval
    }}>
      {children}
    </OpenSignerApprovalContext.Provider>
  );
};

export const useOpenSignerApproval = () => {
  const context = useContext(OpenSignerApprovalContext);
  if (!context) {
    throw new Error('useOpenSignerApproval must be used within a OpenSignerApprovalProvider');
  }
  return context;
};