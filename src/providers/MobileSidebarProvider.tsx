'use client'

import { createContext, useContext, useState, ReactNode } from 'react';

type MobileSidebarContextType = {
  openSidebar: boolean;
  setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
};

const MobileSidebarContext = createContext<MobileSidebarContextType | null>(null);

export const MobileSidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [openSidebar, setOpenSidebar] = useState<boolean>(false);

  return (
    <MobileSidebarContext.Provider value={{
      openSidebar,
      setOpenSidebar,
    }}>
      {children}
    </MobileSidebarContext.Provider>
  );
};

export const useMobileSidebar = () => {
  const context = useContext(MobileSidebarContext);
  if (!context) {
    throw new Error('useMobileSidebar must be used within a MobileSidebarProvider');
  }
  return context;
};