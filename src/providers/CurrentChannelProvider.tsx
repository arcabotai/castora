'use client'

import { Channel } from '@/types';
import { createContext, useContext, useState, ReactNode } from 'react';

type CurrentChannelContextType = {
  currentChannel: Channel;
  setCurrentChannel: (currentChannel: Channel) => void;
};

const CurrentChannelContext = createContext<CurrentChannelContextType | null>(null);

export const CurrentChannelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentChannel, setCurrentChannel] = useState<Channel>();

  return (
    <CurrentChannelContext.Provider value={{
      currentChannel,
      setCurrentChannel,
    }}>
      {children}
    </CurrentChannelContext.Provider>
  );
};

export const useCurrentChannel = () => {
  const context = useContext(CurrentChannelContext);
  if (!context) {
    throw new Error('useCurrentChannel must be used within a CurrentChannelProvider');
  }
  return context;
};