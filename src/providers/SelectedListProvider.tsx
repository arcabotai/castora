'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type List = {
  id: string
  name: string
}

type SelectedListContextType = {
  selectedList: List | null;
  setSelectedList: (list: List | null) => void;
  includeRecast: boolean;
  setIncludeRecast: (include: boolean) => void;
  editedList: List | null;
  setEditedList: (list: List | null) => void;
};

const SelectedListContext = createContext<SelectedListContextType | null>(null);

export const SelectedListProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [editedList, setEditedList] = useState<List | null>(null);
  const [includeRecast, setIncludeRecast] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedIncludeRecast = localStorage.getItem('includeRecast');
      return savedIncludeRecast ? JSON.parse(savedIncludeRecast) : true;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('includeRecast', JSON.stringify(includeRecast));
    }
  }, [includeRecast]);

  return (
    <SelectedListContext.Provider value={{
      selectedList,
      setSelectedList,
      includeRecast,
      setIncludeRecast,
      editedList,
      setEditedList,
    }}>
      {children}
    </SelectedListContext.Provider>
  );
};

export const useSelectedList = () => {
  const context = useContext(SelectedListContext);
  if (!context) {
    throw new Error('useSelectedList must be used within a SelectedListProvider');
  }
  return context;
};