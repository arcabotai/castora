'use client'

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useInfiniteQuery, useQueryClient } from 'react-query';
import { usePrivy } from '@privy-io/react-auth';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import { HOST_URL } from '@/utils/hostURL';

export type NotificationTab = 'all' | 'replies' | 'mentions' | 'likes' | 'recasts' | 'follows';

export const NOTIFICATION_TABS: { key: NotificationTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'replies', label: 'Replies' },
  { key: 'mentions', label: 'Mentions' },
  { key: 'likes', label: 'Likes' },
  { key: 'recasts', label: 'Recasts' },
  { key: 'follows', label: 'Follows' },
];

// Maps a tab to the Neynar notification `type` filter ('' = no filter / all).
const TAB_TO_NEYNAR_TYPE: Record<NotificationTab, string> = {
  all: '',
  replies: 'replies',
  mentions: 'mentions',
  likes: 'likes',
  recasts: 'recasts',
  follows: 'follows',
};

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const { supercastUserState, isRegularUser } = useSupercastUserState();
  const { ready: privyReady, authenticated, getAccessToken } = usePrivy();
  const queryClient = useQueryClient();
  const [selectedMode, setSelectedMode] = useState<NotificationTab>(() => {
    if (typeof window !== 'undefined') {
      const storedMode = localStorage.getItem('selectedMode');
      if (storedMode && NOTIFICATION_TABS.some((t) => t.key === storedMode)) {
        return storedMode as NotificationTab;
      }
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
    const params = new URLSearchParams({ priority: String(priorityMode), cursor: pageParam });
    const neynarType = TAB_TO_NEYNAR_TYPE[selectedMode];
    if (neynarType) params.set('type', neynarType);
    return axios.get(`${HOST_URL}/api/notifications?${params.toString()}`, {
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
