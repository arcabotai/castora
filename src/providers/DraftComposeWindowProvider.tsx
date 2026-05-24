'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type DraftComposeWindowContextType = {
  openDraftComposeWindow: boolean;
  setOpenDraftComposeWindow: React.Dispatch<React.SetStateAction<boolean>>;
  initialText: string;
  setInitialText: React.Dispatch<React.SetStateAction<string>>;
  initialEmbeds: any[];
  setInitialEmbeds: React.Dispatch<React.SetStateAction<any[]>>;
  initialRecastId: { hash: string; fid: number } | null;
  setInitialRecastId: React.Dispatch<React.SetStateAction<{ hash: string; fid: number } | null>>;
};

const DraftComposeWindowContext = createContext<DraftComposeWindowContextType | null>(null);

export const DraftComposeWindowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [openDraftComposeWindow, setOpenDraftComposeWindow] = useState<boolean>(false);
  const [initialText, setInitialText] = useState<string>('');
  const [initialEmbeds, setInitialEmbeds] = useState<any[]>([]);
  const [initialRecastId, setInitialRecastId] = useState<{ hash: string; fid: number } | null>(null);

  return (
    <DraftComposeWindowContext.Provider value={{
      openDraftComposeWindow,
      setOpenDraftComposeWindow,
      initialText,
      setInitialText,
      initialEmbeds,
      setInitialEmbeds,
      initialRecastId,
      setInitialRecastId,
    }}>
      {children}
    </DraftComposeWindowContext.Provider>
  );
};

export const useDraftComposeWindow = () => {
  const context = useContext(DraftComposeWindowContext);
  if (!context) {
    throw new Error('useDraftComposeWindow must be used within a DraftComposeWindowProvider');
  }
  return context;
};