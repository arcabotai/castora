'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useSelectedCast } from '@/providers/SelectedCastProvider'
import GeneralNotification from './notifications/GeneralNotification'
import Spinner from './Spinner'
import PullToRefresh from 'react-simple-pull-to-refresh';
import { isMobile } from 'react-device-detect'
import { useInView } from 'react-intersection-observer';
import FeedHeader from './FeedHeader';
import { useNotifications } from '@/providers/NotificationsProvider'
import { useNotificationsRefresh } from '@/providers/FeedRefreshProvider'
import CastInFeedSkeleton from './casts/CastInFeedSkeleton'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useHotkeys } from 'react-hotkeys-hook'
import { Loader2 } from 'lucide-react'

export default function NotificationsFeed() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setHash } = useSelectedCast();
  const { ref: inViewRef, inView } = useInView();
  const { notificationsQuery, selectedMode, setSelectedMode, priorityMode, setPriorityMode, queryClient, markNotificationsAsSeen } = useNotifications();
  const { setRefreshFunction } = useNotificationsRefresh();
  const notificationsTopRef = useRef<HTMLDivElement>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(-1);

  useHotkeys('p', () => {
    setPriorityMode(prev => !prev)
  })

  useEffect(() => {
    if (inView && notificationsQuery.hasNextPage && !notificationsQuery.isFetchingNextPage) {
      notificationsQuery.fetchNextPage();
    }
  }, [
    inView,
    notificationsQuery.isFetchingNextPage,
    notificationsQuery.hasNextPage
  ]);

  useEffect(() => {
    setHash("");
    markNotificationsAsSeen(); // Mark notifications as seen when component mounts
  }, []);

  useEffect(() => {
    setRefreshFunction(async () => {
      notificationsTopRef.current?.scrollIntoView({ behavior: 'smooth' })
      await notificationsQuery.refetch()
    })
  }, [setRefreshFunction, notificationsQuery])

  const refreshHandler = async (): Promise<void> => {
    return notificationsQuery.refetch().then(() => { });
  }

  const renderSkeletons = () => (
    <ul>
      {[...Array(10)].map((_, index) => (
        <li key={index} className='px-4 sm:px-6 lg:px-8 border-b dark:border-gray-800'>
          <CastInFeedSkeleton />
        </li>
      ))}
    </ul>
  );

  const togglePriorityMode = () => {
    setPriorityMode(prev => !prev)
    if (!isDesktop) {
      setIsDrawerOpen(false)
    }
  }

  const renderSettingsContent = () => (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Priority mode</span>
          <Switch
            checked={priorityMode}
            onCheckedChange={togglePriorityMode}
          />
        </div>
      </div>
      {!isDesktop && (
        <DrawerFooter>
          <DrawerClose>
            <Button variant='secondary' className='w-full'>Close</Button>
          </DrawerClose>
        </DrawerFooter>
      )}
    </>
  )

  const SettingsButton = () => (
    <Button
      variant='outline'
      size='icon'
      onClick={() => isDesktop ? setIsDialogOpen(true) : setIsDrawerOpen(true)}
      className='rounded-full'
    >
      <Cog6ToothIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </Button>
  )

  const getTotalNotificationsCount = useCallback(() => {
    return notificationsQuery.data?.pages.reduce((total, page) => total + page.notifications.length, 0) || 0;
  }, [notificationsQuery.data]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return; // Do nothing if user is typing in an input or textarea
      }
      if (event.key === 'j') {
        setCurrentNotificationIndex((prevIndex) => Math.min(prevIndex + 1, getTotalNotificationsCount() - 1));
      } else if (event.key === 'k') {
        setCurrentNotificationIndex((prevIndex) => Math.max(prevIndex - 1, 0));
      } else if (event.key === 'Enter') {
        const currentNotification = notificationsQuery.data?.pages.flatMap(page => page.notifications)[currentNotificationIndex];
        if (currentNotification) {
          // Navigate to the notification's target (e.g., cast, profile, etc.)
          // This will depend on your notification structure and navigation logic
          // For example, if it's a cast notification:
          if (currentNotification.type !== 'follows') {
            setHash(currentNotification.cast.hash);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentNotificationIndex, notificationsQuery.data, setHash, getTotalNotificationsCount]);

  useEffect(() => {
    if (currentNotificationIndex >= 0 && currentNotificationIndex < getTotalNotificationsCount()) {
      const notificationElement = document.getElementById(`notification-${currentNotificationIndex}`);
      if (notificationElement) {
        notificationElement.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    }
  }, [currentNotificationIndex, getTotalNotificationsCount]);

  const pullToRefreshContent = (
    <div className='flex flex-row items-center justify-center gap-x-2 pt-2 animate-pulse text-gray-500 text-sm'>
      <p>Pull to refresh</p>
    </div>
  )

  return (
    <div ref={notificationsTopRef} className="pt-12 lg:pt-0">
      <FeedHeader
        title="Notifications"
        rightAction={
          <SettingsButton />
        }
      />
      <div className='gap-y-2 px-4 sm:px-6 lg:px-8 border-b dark:border-gray-800'>
        {/* two tabs, "all" and "mentions" */}
        <div className='flex flex-row'>
          <button
            className={`w-1/2 flex flex-row justify-center py-2 lg:hover:bg-gray-50 lg:dark:hover:bg-gray-800 dark:border-gray-700 ${selectedMode === 'all' && 'border-b-4'}`}
            onClick={() => {
              setSelectedMode('all')
              queryClient.resetQueries(['notifications']);
            }}
          >
            <span className='text-sm font-semibold text-gray-700 dark:text-gray-200'>All</span>
          </button>
          <button
            className={`w-1/2 flex flex-row justify-center py-2 lg:hover:bg-gray-50 lg:dark:hover:bg-gray-800 dark:border-gray-700 ${selectedMode === 'mentions' && 'border-b-4'}`}
            onClick={() => {
              setSelectedMode('mentions')
              queryClient.resetQueries(['notifications']);
            }}
          >
            <span className='text-sm font-semibold text-gray-700 dark:text-gray-200'>Mentions</span>
          </button>
        </div>
      </div>
      <div>
        {notificationsQuery.isLoading ? (
          renderSkeletons()
        ) : notificationsQuery.isSuccess ? (
          <PullToRefresh
            onRefresh={refreshHandler}
            pullingContent={pullToRefreshContent}
            refreshingContent={<Loader2 className='h-8 w-8 mx-auto animate-spin mt-2' />}
            isPullable={isMobile}
          >
            <ul className=''>
              {notificationsQuery.data.pages.map((page, pageIndex) => (
                <React.Fragment key={pageIndex}>
                  {page.notifications.map((notification, notificationIndex) => {
                    const globalIndex = pageIndex * page.notifications.length + notificationIndex;
                    return (
                      <li
                        key={`${notification.most_recent_timestamp}-${notificationIndex}`}
                        id={`notification-${globalIndex}`}
                        className={`${globalIndex === currentNotificationIndex ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                      >
                        {notificationIndex === 5 && <div ref={inViewRef} className="h-1"></div>}
                        <GeneralNotification
                          key={notification.most_recent_timestamp + notificationIndex}
                          notification={notification}
                          isSelected={globalIndex === currentNotificationIndex}
                        />
                      </li>
                    );
                  })}
                </React.Fragment>
              ))}
            </ul>
          </PullToRefresh>
        ) : (
          <div className='flex flex-row justify-center py-3'>
            <span className='text-gray-500 text-sm'>Error fetching notifications</span>
          </div>
        )}
        {notificationsQuery.isFetchingNextPage && renderSkeletons()}
      </div>
      {isDesktop ? (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Notifications settings</DialogTitle>
            </DialogHeader>
            {renderSettingsContent()}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Notifications settings</DrawerTitle>
            </DrawerHeader>
            {renderSettingsContent()}
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
