'use client'

import { createContext, useContext, useState, ReactNode } from 'react';

type DeletedCastContextType = {
  deletedCastMap: {};
  setDeletedCastMap: React.Dispatch<React.SetStateAction<{}>>;
};

const DeletedCastContext = createContext<DeletedCastContextType | null>(null);

export const DeletedCastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [deletedCastMap, setDeletedCastMap] = useState<{}>({});

  return (
    <DeletedCastContext.Provider value={{
      deletedCastMap,
      setDeletedCastMap,
    }}>
      {children}
    </DeletedCastContext.Provider>
  );
};

export const useDeletedCast = () => {
  const context = useContext(DeletedCastContext);
  if (!context) {
    throw new Error('useDeletedCast must be used within a DeletedCastProvider');
  }
  return context;
};