'use client'

import {
  BellIcon as BellIconSolid,
  HomeIcon as HomeIconSolid,
  PlusIcon,
  WalletIcon as WalletIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
} from '@heroicons/react/24/solid'
import {
  BellIcon,
  HomeIcon,
  SparklesIcon,
  WalletIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useIosPwa } from '@/providers/iOSPwaProvider'
import { Button } from '../ui/button'
import { useDraftComposeWindow } from '@/providers/DraftComposeWindowProvider'
import { useDraftId } from '@/providers/DraftIdProvider'
import { useFeedRefresh, useNotificationsRefresh } from '@/providers/FeedRefreshProvider'
import Spinner from '../Spinner'
import { useState } from 'react'
import { useNotifications } from '@/providers/NotificationsProvider'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { useRouter } from 'next/navigation'

interface MobileNavbarProps {
  currentTab: string
}

export default function MobileNavbar(props: MobileNavbarProps) {
  const { currentTab } = props
  const { isIosPwa } = useIosPwa();
  const { refreshFeed, isRefreshing } = useFeedRefresh();
  const { refreshFeed: refreshNotifications, isRefreshing: isRefreshingNotifications } = useNotificationsRefresh();
  const { notificationsQuery, notificationsSeen } = useNotifications();
  const { setOpenDraftComposeWindow } = useDraftComposeWindow()
  const { draftId, setDraftId } = useDraftId()
  const { isGuest, isRegularUser } = useSupercastUserState()

  const [activeIcon, setActiveIcon] = useState(currentTab)

  const router = useRouter()

  const navItemClass = `group w-1/5 h-full flex items-center justify-center transition-all duration-150 ease-in-out ${isIosPwa ? 'pb-6' : 'pb-0'} active:scale-90`;
  const iconClass = 'h-7 w-7 dark:text-white';

  const unreadCount = notificationsQuery?.data?.pages[0]?.unread || 0;

  const handleIconClick = (iconName: string) => {
    setActiveIcon(iconName)
  }

  const handleRefreshHomeFeed = async (e: React.MouseEvent) => {
    if (currentTab === 'Home') {
      e.preventDefault()
      console.log('refreshing in mobile navbar')
      try {
        await refreshFeed()
      } catch (error) {
        console.error('Error refreshing feed:', error)
      } finally {
        console.log('done refreshing in mobile navbar')
      }
    }
  }

  const handleRefreshNotifications = async (e: React.MouseEvent) => {
    if (currentTab === 'Notifications') {
      e.preventDefault()
      console.log('refreshing notifications in mobile navbar')
      try {
        await refreshNotifications()
      } catch (error) {
        console.error('Error refreshing notifications:', error)
      } finally {
        console.log('done refreshing notifications in mobile navbar')
      }
    }
  }

  return (
    <nav className={`lg:hidden ${isIosPwa ? 'h-20' : 'h-14'} w-full border-t bg-white dark:border-gray-800 dark:bg-gray-900 shrink-0 flex flex-row`}>
      <Link
        href={"/"}
        className={navItemClass}
        onClick={(e) => {
          handleIconClick('Home')
          handleRefreshHomeFeed(e)
        }}
      >
        {activeIcon === 'Home'
          ? isRefreshing
            ? <Spinner width={'w-7'} height={'h-7'} color={'text-gray-200 dark:text-white'} fill={'fill-gray-900 dark:fill-black'} />
            : <HomeIconSolid className={iconClass} />
          : <HomeIcon className={iconClass} />
        }
      </Link>
      <Link
        href={"/explore"}
        className={navItemClass}
        onClick={() => handleIconClick('Explore')}
      >
        {activeIcon === 'Explore'
          ? <MagnifyingGlassIconSolid className={iconClass} />
          : <MagnifyingGlassIcon className={iconClass} />
        }
      </Link>
      <div className={`${navItemClass} active:scale-100`} onClick={() => {
        if (isRegularUser()) {
          setDraftId(null)
          setOpenDraftComposeWindow(true)
        } else {
          router.push('/onboarding')
        }
      }}>
        <Button className='w-10 h-10 rounded-full p-0 shadow-md active:scale-90 transition-all duration-150 ease-in-out'>
          <PlusIcon className='h-7 w-7' />
        </Button>
      </div>
      <Link
        href={"/wallet"}
        className={navItemClass}
        onClick={() => handleIconClick('Wallet')}
      >
        {activeIcon === 'Wallet'
          ? <WalletIconSolid className={iconClass} />
          : <WalletIcon className={iconClass} />
        }
      </Link>
      {isRegularUser() &&
        <Link
          className={`relative ${navItemClass}`}
          href={"/notifications"}
          onClick={(e) => {
            handleIconClick('Notifications')
            handleRefreshNotifications(e)
          }}
        >
          <div className='relative'>
            {activeIcon === 'Notifications'
              ? isRefreshingNotifications
                ? <Spinner width={'w-7'} height={'h-7'} color={'text-gray-200 dark:text-white'} fill={'fill-gray-900 dark:fill-black'} />
                : <BellIconSolid className={iconClass} />
              : <BellIcon className={iconClass} />
            }
            {(unreadCount > 0 && activeIcon !== 'Notifications' && !notificationsSeen) && (
              <span className={`absolute -top-1 -right-1 ${unreadCount == 15 ? 'w-5' : 'w-4'} h-4 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] z-10`}>
                {`${unreadCount}${unreadCount == 15 ? '+' : ''}`}
              </span>
            )}
          </div>
        </Link>
      }
      {isGuest() &&
        <Link
          href={"/community"}
          className={navItemClass}
          onClick={() => handleIconClick('Community')}
        >
          {activeIcon === 'Community'
            ? <ChatBubbleLeftRightIconSolid className={iconClass} />
            : <ChatBubbleLeftRightIcon className={iconClass} />
          }
        </Link>
      }
    </nav>
  )
}