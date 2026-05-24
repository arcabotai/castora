'use client'

import React, { createContext, useContext, useRef, useCallback, useState } from 'react';

interface FeedRefreshContextType {
  refreshFeed: () => Promise<void>;
  setRefreshFunction: (func: () => Promise<void>) => void;
  isRefreshing: boolean;
}

const FeedRefreshContext = createContext<FeedRefreshContextType | undefined>(undefined);
const NotificationsRefreshContext = createContext<FeedRefreshContextType | undefined>(undefined);

export function FeedRefreshProvider({ children }: { children: React.ReactNode }) {
  const refreshFunctionRef = useRef<(() => Promise<void>) | null>(null);
  const notificationsRefreshFunctionRef = useRef<(() => Promise<void>) | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshFeed = useCallback(async () => {
    if (refreshFunctionRef.current) {
      setIsRefreshing(true);
      try {
        await refreshFunctionRef.current();
      } finally {
        setIsRefreshing(false);
      }
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (notificationsRefreshFunctionRef.current) {
      setIsRefreshing(true);
      try {
        await notificationsRefreshFunctionRef.current();
      } finally {
        setIsRefreshing(false);
      }
    }
  }, []);

  const setRefreshFunction = useCallback((func: () => Promise<void>) => {
    refreshFunctionRef.current = func;
  }, []);

  const setNotificationsRefreshFunction = useCallback((func: () => Promise<void>) => {
    notificationsRefreshFunctionRef.current = func;
  }, []);

  return (
    <FeedRefreshContext.Provider value={{ refreshFeed, setRefreshFunction, isRefreshing }}>
      <NotificationsRefreshContext.Provider value={{ refreshFeed: refreshNotifications, setRefreshFunction: setNotificationsRefreshFunction, isRefreshing }}>
        {children}
      </NotificationsRefreshContext.Provider>
    </FeedRefreshContext.Provider>
  );
}

export function useFeedRefresh() {
  const context = useContext(FeedRefreshContext);
  if (context === undefined) {
    throw new Error('useFeedRefresh must be used within a FeedRefreshProvider');
  }
  return context;
}

export function useNotificationsRefresh() {
  const context = useContext(NotificationsRefreshContext);
  if (context === undefined) {
    throw new Error('useNotificationsRefresh must be used within a FeedRefreshProvider');
  }
  return context;
}