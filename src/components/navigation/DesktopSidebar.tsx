import Link from 'next/link'
import Spinner from '../Spinner'
import ActiveChannelsColumn from '../ActiveChannelsColumn'
import ProfileBar from '../ProfileBar'
import { useNotifications } from '@/providers/NotificationsProvider'
import { useState } from 'react'
import { classNames } from '@/utils/classNames'
import { useNotificationsRefresh } from '@/providers/FeedRefreshProvider'
import { useCommunityDot } from '@/hooks/useCommunityDot'

import {
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  BellIcon as BellIconSolid,
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
  UserIcon as UserIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  CogIcon as CogIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  MapIcon as MapIconSolid,
  WalletIcon as WalletIconSolid,
} from '@heroicons/react/24/solid'
import {
  BellIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  UserIcon,
  BookmarkIcon,
  UsersIcon,
  CogIcon,
  ChatBubbleLeftRightIcon,
  MapIcon,
  WalletIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { SUPERANON_ADMIN_FIDS } from '@/utils/anon/admin'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon, iconCurrent: HomeIconSolid, superanonAvailable: true, guestAvailable: true },
  { name: 'Notifications', href: '/notifications', icon: BellIcon, iconCurrent: BellIconSolid, superanonAvailable: true, guestAvailable: false },
  { name: 'Explore', href: '/explore', icon: MagnifyingGlassIcon, iconCurrent: MagnifyingGlassIconSolid, superanonAvailable: true, guestAvailable: true },
  { name: 'Wallet', href: '/wallet', icon: WalletIcon, iconCurrent: WalletIconSolid, superanonAvailable: true, guestAvailable: true },
  { name: 'Community', href: '/community', icon: ChatBubbleLeftRightIcon, iconCurrent: ChatBubbleLeftRightIconSolid, superanonAvailable: false, guestAvailable: true },
  { name: 'Settings', href: '/settings', icon: CogIcon, iconCurrent: CogIconSolid, superanonAvailable: false, guestAvailable: true },
  { name: 'Profile', href: '/ifyouseethisthereisabug', icon: UserIcon, iconCurrent: UserIconSolid, superanonAvailable: true, guestAvailable: false },
]

export default function DesktopSidebar({
  currentTab,
  supercastUserState,
  handleRefresh,
  isRefreshing,
}) {
  const { isSuperanon, isAdmin, isGuest, getCurrentProfile, isAuthenticated } = useSupercastUserState();
  const { notificationsQuery, notificationsSeen } = useNotifications();
  const { refreshFeed: refreshNotifications, isRefreshing: isRefreshingNotifications } = useNotificationsRefresh();
  const unreadCount = notificationsQuery?.data?.pages[0]?.unread || 0;

  const [activeTab, setActiveTab] = useState(currentTab);

  const { showDot, handleCommunityClick } = useCommunityDot();

  const isSuperanonNonAdmin = isSuperanon() && !isAdmin();
  const currentProfile = getCurrentProfile();

  return (
    <div className="hidden lg:flex lg:flex-col lg:basis-1/6 shrink-0 min-w-[200px]">
      {/* Sidebar component, swap this element with another sidebar if you like */}
      <div className="fixed top-0 flex flex-col gap-y-2 border-gray-200 bg-white dark:bg-gray-900 min-h-screen max-h-screen pb-4">
        <div className="flex h-16 shrink-0 items-center w-40 xl:w-48 justify-start">
          <div
            onClick={() => {
              navigator.clipboard.writeText("ツ")
              toast.success("ツ copied to clipboard")
            }}
            className='hover:cursor-pointer hover:opacity-80'
          >
            <img
              className="h-8 w-auto dark:hidden"
              src="/supercast-logo-black.png"
              alt="Your Company"
            />
            <img
              className="h-8 w-auto hidden dark:block"
              src="/supercast-logo-white.png"
              alt="Your Company"
            />
          </div>
        </div>
        <div className='flex flex-col flex-grow overflow-auto'>
          {isAuthenticated() ?
            <nav className="flex flex-col pb-2">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="space-y-1">
                    {/* desktop sidebar */}
                    {navigation.map((item) => (
                      <li key={item.name} className={(isSuperanonNonAdmin && !item.superanonAvailable) ? 'hidden' : ''}>
                        <Link
                          href={item.name === 'Profile' ? `/${currentProfile?.username}` : item.href}
                          onClick={async (e) => {
                            if (!item.guestAvailable && isGuest()) {
                              e.preventDefault();
                              return;
                            }
                            setActiveTab(item.name);
                            if (item.name === 'Home' && currentTab === 'Home') {
                              handleRefresh(e)
                            } else if (item.name === 'Notifications' && currentTab === 'Notifications') {
                              e.preventDefault();
                              await refreshNotifications();
                            } else if (item.name === 'Community') {
                              handleCommunityClick();
                            }
                          }}
                          className={classNames(
                            item.name == activeTab
                              ? 'bg-gray-50 text-gray-900 dark:bg-gray-700 font-semibold'
                              : `text-gray-500 font-medium ${!item.guestAvailable && isGuest() ? 'opacity-50 hover:cursor-auto' : 'hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-100'}`,
                            'group flex items-center rounded-md p-2 text-sm leading-6 dark:text-gray-100',
                          )}
                        >
                          <div className='flex flex-row items-center flex-grow gap-x-2'>
                            {item.name == activeTab && item.name === 'Home' && isRefreshing
                              ? <Spinner width={'w-5'} height={'h-5'} />
                              : item.name == activeTab && item.name === 'Notifications' && isRefreshingNotifications
                                ? <Spinner width={'w-5'} height={'h-5'} />
                                : item.name == activeTab
                                  ? <item.iconCurrent
                                    className={'text-gray-900 h-5 w-5 shrink-0 dark:text-gray-100'}
                                    aria-hidden="true"
                                  />
                                  : <item.icon
                                    className={'text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-100 h-5 w-5 shrink-0 dark:text-gray-100'}
                                    aria-hidden="true"
                                  />
                            }
                            {item.name}
                          </div>
                          {(item.name == 'Notifications' && unreadCount > 0 && activeTab !== 'Notifications' && !notificationsSeen) && (
                            <span className={`${unreadCount == 15 ? 'w-[20px]' : 'w-[14px]'} h-[14px] rounded-full bg-red-600 flex items-center justify-center text-white text-[9px]`}>
                              {`${unreadCount}${unreadCount == 15 ? '+' : ''}`}
                            </span>
                          )}
                          {item.name === 'Community' && showDot && (
                            <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            </nav>
            : <></>
          }
          <ActiveChannelsColumn />
        </div>
        {<ProfileBar />}
      </div>
    </div>
  )
}