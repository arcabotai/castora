'use client'

import { createContext, useContext, useState, ReactNode } from 'react';

type OpenCastModalContextType = {
  openCastModal: boolean;
  setOpenCastModal: (open: boolean) => void;
};

const OpenCastModalContext = createContext<OpenCastModalContextType | null>(null);

export const OpenCastModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [openCastModal, setOpenCastModal] = useState<boolean>(false);

  return (
    <OpenCastModalContext.Provider value={{
      openCastModal,
      setOpenCastModal
    }}>
      {children}
    </OpenCastModalContext.Provider>
  );
};

export const useOpenCastModal = () => {
  const context = useContext(OpenCastModalContext);
  if (!context) {
    throw new Error('useOpenCastModal must be used within a OpenCastModalProvider');
  }
  return context;
};