'use client'

import { createContext, useContext, useState, ReactNode } from 'react';

type SelectedCastContextType = {
  hash: string;
  setHash: React.Dispatch<React.SetStateAction<string>>;
  navigateToCast: (e: React.MouseEvent | KeyboardEvent, hash: string) => void;
};

const SelectedCastContext = createContext<SelectedCastContextType | null>(null);

export const SelectedCastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hash, setHash] = useState<string>('');

  const navigateToCast = (e: React.MouseEvent | KeyboardEvent, hash: string) => {
    e.stopPropagation();
    setHash(hash);
  }

  return (
    <SelectedCastContext.Provider value={{
      hash,
      setHash,
      navigateToCast,
    }}>
      {children}
    </SelectedCastContext.Provider>
  );
};

export const useSelectedCast = () => {
  const context = useContext(SelectedCastContext);
  if (!context) {
    throw new Error('useSelectedCast must be used within a SelectedCastProvider');
  }
  return context;
};