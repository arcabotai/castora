'use client'

import { createContext, useContext, useState, ReactNode } from 'react';

type PaywallContextType = {
  openPaywall: boolean;
  setOpenPaywall: React.Dispatch<React.SetStateAction<boolean>>;
};

const PaywallContext = createContext<PaywallContextType | null>(null);

export const PaywallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [openPaywall, setOpenPaywall] = useState<boolean>(false);

  return (
    <PaywallContext.Provider value={{
      openPaywall,
      setOpenPaywall,
    }}>
      {children}
    </PaywallContext.Provider>
  );
};

export const usePaywall = () => {
  const context = useContext(PaywallContext);
  if (!context) {
    throw new Error('usePaywall must be used within a PaywallProvider');
  }
  return context;
};