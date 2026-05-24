'use client'

import { createContext, useContext, useState, ReactNode } from 'react';

type PWAPromptContextType = {
  isOpenPWAPrompt: boolean;
  setIsOpenPWAPrompt: React.Dispatch<React.SetStateAction<boolean>>;
};

const PWAPromptContext = createContext<PWAPromptContextType | null>(null);

export const PWAPromptProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpenPWAPrompt, setIsOpenPWAPrompt] = useState<boolean>(false);

  return (
    <PWAPromptContext.Provider value={{
      isOpenPWAPrompt,
      setIsOpenPWAPrompt,
    }}>
      {children}
    </PWAPromptContext.Provider>
  );
};

export const usePWAPrompt = () => {
  const context = useContext(PWAPromptContext);
  if (!context) {
    throw new Error('usePWAPrompt must be used within a PWAPromptProvider');
  }
  return context;
}; 