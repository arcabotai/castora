'use client'

import { createContext, useContext, useState, ReactNode } from 'react';

type OpenHotkeyShortcutWindowContextType = {
  openHotkeyShortcutWindow: boolean;
  setOpenHotkeyShortcutWindow: React.Dispatch<React.SetStateAction<boolean>>;
};

const OpenHotkeyShortcutWindowContext = createContext<OpenHotkeyShortcutWindowContextType | null>(null);

export const OpenHotkeyShortcutWindowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [openHotkeyShortcutWindow, setOpenHotkeyShortcutWindow] = useState<boolean>(false);

  return (
    <OpenHotkeyShortcutWindowContext.Provider value={{
      openHotkeyShortcutWindow,
      setOpenHotkeyShortcutWindow
    }}>
      {children}
    </OpenHotkeyShortcutWindowContext.Provider>
  );
};

export const useOpenHotkeyShortcutWindow = () => {
  const context = useContext(OpenHotkeyShortcutWindowContext);
  if (!context) {
    throw new Error('useOpenHotkeyShortcutWindow must be used within a OpenHotkeyShortcutWindowProvider');
  }
  return context;
};