'use client'

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useInfiniteQuery, useQueryClient } from 'react-query';
import { usePrivy } from '@privy-io/react-auth';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import { HOST_URL } from '@/utils/hostURL';

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const { supercastUserState, isRegularUser } = useSupercastUserState();
  const { ready: privyReady, authenticated, getAccessToken } = usePrivy();
  const queryClient = useQueryClient();
  const [selectedMode, setSelectedMode] = useState<'all' | 'mentions'>(() => {
    if (typeof window !== 'undefined') {
      const storedMode = localStorage.getItem('selectedMode');
      return (storedMode === 'all' || storedMode === 'mentions') ? storedMode : 'all';
    }
    return 'all';
  });
  const [priorityMode, setPriorityMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const storedPriorityMode = localStorage.getItem('priorityMode');
      return storedPriorityMode ? JSON.parse(storedPriorityMode) : false;
    }
    return false;
  });
  const [notificationsSeen, setNotificationsSeen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const storedNotificationsSeen = localStorage.getItem('notificationsSeen');
      return storedNotificationsSeen ? JSON.parse(storedNotificationsSeen) : true;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notificationsSeen', JSON.stringify(notificationsSeen));
    }
  }, [notificationsSeen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('priorityMode', JSON.stringify(priorityMode));
    }
  }, [priorityMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedMode', selectedMode);
    }
  }, [selectedMode]);

  const fetchNotifications = async ({ pageParam = '' }) => {
    const accessToken = await getAccessToken();
    return axios.get(`${HOST_URL}/api/notifications?mode=${selectedMode}&priority=${priorityMode}&cursor=${pageParam}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    }).then((response) => {
      if (pageParam === '' && response.data.unread > 0) {
        // mark notifications as unseen when there is something new, after fetching in feed or in notifications page
        setNotificationsSeen(false)
      }
      return response.data;
    })
  };

  const markNotificationsAsSeen = async () => {
    setNotificationsSeen(true)

    const accessToken = await getAccessToken();
    axios.post(`${HOST_URL}/api/notifications/mark-seen`, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    }).then((response) => {
      setNotificationsSeen(true)
    });
  };

  const queryKey = ['notifications', supercastUserState?.currentFid, selectedMode, priorityMode]

  const notificationsQuery = useInfiniteQuery(
    queryKey,
    fetchNotifications,
    {
      getNextPageParam: (lastPage) => lastPage.cursor || undefined,
      enabled: privyReady && authenticated && isRegularUser() && !!supercastUserState?.currentFid,
      staleTime: 180000, // 3 minutes
      cacheTime: 180000, // 3 minutes
    }
  );

  return (
    <NotificationsContext.Provider value={{
      notificationsQuery,
      selectedMode,
      setSelectedMode,
      priorityMode,
      setPriorityMode,
      queryClient,
      notificationsSeen,
      setNotificationsSeen,
      markNotificationsAsSeen
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
