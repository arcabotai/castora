'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

interface IosPwaContextType {
  isIosPwa: boolean;
}

const IosPwaContext = createContext<IosPwaContextType | undefined>(undefined);

export function useIosPwa() {
  const context = useContext(IosPwaContext);
  if (context === undefined) {
    throw new Error('useIosPwa must be used within an IosPwaProvider');
  }
  return context;
}

export function IosPwaProvider({ children }: { children: React.ReactNode }) {
  const [isIosPwa, setIsIosPwa] = useState(false);

  useEffect(() => {
    const cachedValue = localStorage.getItem('isIosPwa');
    if (cachedValue !== null) {
      setIsIosPwa(cachedValue === 'true');
    } else {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || Boolean((window.navigator as any).standalone);
      const detectedIsIosPwa = isIos && isInStandaloneMode;

      setIsIosPwa(detectedIsIosPwa);
      localStorage.setItem('isIosPwa', detectedIsIosPwa.toString());
    }
  }, []);

  return (
    <IosPwaContext.Provider value={{ isIosPwa }}>
      {children}
    </IosPwaContext.Provider>
  );
}
