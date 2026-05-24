'use client'

import { createContext, useContext, useState, ReactNode } from 'react';

type DraftIdContextType = {
  draftId: string;
  setDraftId: React.Dispatch<React.SetStateAction<string>>;
};

const DraftIdContext = createContext<DraftIdContextType | null>(null);

export const DraftIdProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [draftId, setDraftId] = useState<string>();

  return (
    <DraftIdContext.Provider value={{
      draftId,
      setDraftId,
    }}>
      {children}
    </DraftIdContext.Provider>
  );
};

export const useDraftId = () => {
  const context = useContext(DraftIdContext);
  if (!context) {
    throw new Error('useDraftId must be used within a DraftIdProvider');
  }
  return context;
};