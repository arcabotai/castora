import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Link from 'next/link'

import { classNames } from '@/utils/classNames'
import {
  UserIcon as UserIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  CogIcon as CogIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
} from '@heroicons/react/24/solid'
import {
  UserIcon,
  BookmarkIcon,
  PlusIcon,
  CogIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import Image from 'next/image'
import { truncateLongWord } from '@/utils/textUtils'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Skeleton } from '../ui/skeleton'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import PowerBadge from '../PowerBadge'
import SupercastBadge from '../SupercastBadge'
import { useSupercastMember } from '@/providers/SupercastMemberProvider'
import { EllipsisHorizontalIcon } from '@heroicons/react/20/solid'
import { Button } from '../ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer'
import { ScrollArea } from '../ui/scroll-area'
import { useIosPwa } from "@/providers/iOSPwaProvider"
import axios from 'axios'
import { HOST_URL } from "@/utils/hostURL"
import { AUTH_URL } from "@/utils/authURL"
import { usePrivy } from "@privy-io/react-auth"
import { useCommunityDot } from '@/hooks/useCommunityDot'
import { Dog } from 'lucide-react'
import { toast } from 'sonner'
import { SUPERANON_ADMIN_FIDS } from '@/utils/anon/admin'

export default function MobileSidebar({
  openSidebar,
  setOpenSidebar,
  currentTab,
}) {

  const { supercastUserState, switchAccount, getCurrentProfile, isRegularUser, isGuest } = useSupercastUserState();
  const { isSupercastMember } = useSupercastMember()
  const { isIosPwa } = useIosPwa();
  const { getAccessToken } = usePrivy()
  const currentProfile = getCurrentProfile();

  const [openDrawer, setOpenDrawer] = useState(false);
  const [loadingConnectSession, setLoadingConnectSession] = useState<boolean>(false);

  const { showDot, handleCommunityClick } = useCommunityDot();

  const isSuperanonNonAdmin = supercastUserState.currentFid === Number(process.env.NEXT_PUBLIC_SUPERANON_FID) && !SUPERANON_ADMIN_FIDS.includes(supercastUserState.userFid)

  const navigation = [
    { name: 'Community', href: '/community', icon: ChatBubbleLeftRightIcon, iconCurrent: ChatBubbleLeftRightIconSolid, superanonAvailable: false, guestAvailable: true },
    { name: 'Settings', href: '/settings', icon: CogIcon, iconCurrent: CogIconSolid, superanonAvailable: false, guestAvailable: true },
    { name: 'Profile', href: `/${currentProfile?.username}`, icon: UserIcon, iconCurrent: UserIconSolid, superanonAvailable: false, guestAvailable: false },
  ]

  const handleAccountSwitch = (fid: number) => {
    switchAccount(fid);
    setOpenDrawer(false);
    setOpenSidebar(false);
  };

  const handleAddAccount = async () => {

    alert('Temporarily unavailable, coming back soon!')
    return

    setOpenDrawer(false);
    setOpenSidebar(false);
    setLoadingConnectSession(true);
    const accessToken = await getAccessToken();

    axios.post(`${HOST_URL}/api/account/create-connection`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'asFid': supercastUserState.userFid
      }
    }).then((response) => {
      const sessionId = response.data.connectionSession;
      window.location.href = `${AUTH_URL}?sessionId=${sessionId}`;
    }).finally(() => {
      setLoadingConnectSession(false);
    });
  };

  return (
    <Transition.Root show={openSidebar} as={Fragment}>
      {(isRegularUser() || isGuest()) && (
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setOpenSidebar}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/60" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-[260px] flex-1">
                <div className="flex grow flex-col gap-y-2 overflow-y-auto bg-white dark:bg-gray-900 px-6 pb-2">
                  {isRegularUser() &&
                    <div className="flex flex-row items-start justify-between gap-x-2 pt-4">
                      <Link href={`/${currentProfile?.username || ''}`} onClick={() => setOpenSidebar(false)}>
                        <Avatar className="w-12 h-12">
                          <AvatarImage
                            width={40}
                            height={40}
                            src={currentProfile?.avatar || ''}
                            alt="Profile picture"
                          />
                          <AvatarFallback>
                            <Skeleton className="w-12 h-12 rounded-full" />
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex flex-row gap-x-1 items-center">
                        {supercastUserState.accounts.filter((account) => account.fid !== currentProfile?.fid).slice(0, 2).map((account) => (
                          <div key={account.fid} onClick={() => handleAccountSwitch(account.fid)} className="cursor-pointer">
                            <Avatar className="w-7 h-7 border border-gray-200 dark:border-gray-800">
                              <AvatarImage
                                src={account.avatar}
                                alt="Profile picture"
                              />
                              <AvatarFallback>
                                <Skeleton className="w-7 h-7 rounded-full" />
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        ))}
                        {supercastUserState.accounts.length <= 3 && (
                          <Button
                            onClick={handleAddAccount}
                            className='w-7 h-7 rounded-full p-0'
                            variant='outline'
                          >
                            <PlusIcon className="w-4 h-4" />
                          </Button>
                        )}
                        {supercastUserState.accounts.length > 2 && (
                          <Drawer open={openDrawer} onClose={() => setOpenDrawer(false)}>
                            <DrawerTrigger>
                              <Button
                                onClick={() => setOpenDrawer(true)}
                                className='w-7 h-7 rounded-full p-0'
                                variant='outline'
                              >
                                <EllipsisHorizontalIcon className="w-4 h-4" />
                              </Button>
                            </DrawerTrigger>
                            <DrawerContent>
                              <DrawerHeader>
                                <DrawerTitle>
                                  Switch account
                                </DrawerTitle>
                              </DrawerHeader>
                              <ScrollArea className='h-[220px] px-4'>
                                {supercastUserState.accounts.filter((account) => account.fid !== currentProfile.fid).map((account) => (
                                  <div key={account.fid} onClick={() => handleAccountSwitch(account.fid)} className="cursor-pointer mb-2 flex flex-row items-center gap-x-2">
                                    <Avatar className="w-8 h-8">
                                      <AvatarImage
                                        src={account.avatar}
                                        alt="Profile picture"
                                        className=''
                                      />
                                      <AvatarFallback>
                                        <Skeleton className="w-8 h-8 rounded-full" />
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-base font-medium">{truncateLongWord(account?.displayName || '', 20)}</span>
                                    <span className="text-base text-gray-500">@{truncateLongWord(account?.username || '', 20)}</span>
                                  </div>
                                ))}
                                {supercastUserState.accounts.length > 3 && (
                                  <div onClick={handleAddAccount} className="cursor-pointer mb-2 flex flex-row items-center gap-x-2">
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback>
                                        <PlusIcon className="w-5 h-5" />
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-base font-medium">Add account</span>
                                  </div>
                                )}
                              </ScrollArea>
                              <DrawerFooter>
                                <DrawerClose>
                                  <Button onClick={() => setOpenDrawer(false)} variant='secondary' className='w-full'>Close</Button>
                                </DrawerClose>
                              </DrawerFooter>
                            </DrawerContent>
                          </Drawer>
                        )}
                      </div>
                    </div>
                  }
                  {isRegularUser() && (
                    <div className="flex flex-col">
                      <div className="flex flex-row items-center gap-x-1">
                        <div className="font-bold text-base dark:text-gray-100">{truncateLongWord(currentProfile?.displayName || '', 16)}</div>
                        <div className="flex flex-row items-center gap-x-1">
                          {currentProfile?.powerBadge && <PowerBadge />}
                          {isSupercastMember(currentProfile?.fid || 0) && <SupercastBadge />}
                        </div>
                      </div>
                      <div className="text-gray-400 text-sm">@{currentProfile?.username || ''}</div>
                    </div>
                  )}
                  <nav className="flex flex-1 flex-col pt-3">
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name} className={(isSuperanonNonAdmin && !item.superanonAvailable) ? 'hidden' : ''}>
                          <Link
                            href={item.name === 'Profile' ? `/${supercastUserState.accounts.find((account) => account.fid === supercastUserState.currentFid)?.username}` : item.href}
                            onClick={async (e) => {
                              if (!item.guestAvailable && isGuest()) {
                                e.preventDefault();
                                return;
                              }
                              setOpenSidebar(false);
                              if (item.name === 'Community') {
                                handleCommunityClick();
                              }
                            }}
                            className={classNames(
                              item.name == currentTab
                                ? 'bg-gray-50 text-gray-900 dark:bg-gray-700 font-semibold'
                                : `text-gray-500 font-medium ${!item.guestAvailable && isGuest() ? 'opacity-50' : ''}`,
                              'group flex items-center rounded-md p-2 text-lg leading-6 dark:text-gray-100'
                            )}
                          >
                            <div className='flex flex-row items-center flex-grow gap-x-3'>
                              {item.name == currentTab
                                ?
                                <item.iconCurrent
                                  className={'text-gray-900 h-6 w-6 shrink-0 dark:text-gray-100'}
                                  aria-hidden="true"
                                />
                                :
                                <item.icon
                                  className={'text-gray-500 h-6 w-6 shrink-0 dark:text-gray-100'}
                                  aria-hidden="true"
                                />
                              }
                              {item.name}
                              {item.name === 'Community' && showDot && (
                                <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                      {isGuest() && (
                        <li className='mt-10'>
                          <Link href="/onboarding">
                            <Button className='w-full'>Create profile</Button>
                          </Link>
                        </li>
                      )}
                    </ul>
                  </nav>
                  <div className={`flex justify-start items-center ${isIosPwa ? 'pb-10' : 'pb-4'}`}>
                    <div
                      onClick={() => {
                        navigator.clipboard.writeText("ツ")
                        toast.success("ツ copied to clipboard")
                      }}
                      className="mr-2 hover:cursor-pointer hover:opacity-80"
                    >
                      <img
                        className="h-6 w-6 dark:hidden"
                        src="/castora-mark.svg"
                        alt="Castora mark"
                      />
                      <img
                        className="h-6 w-6 hidden dark:block"
                        src="/castora-mark.svg"
                        alt="Castora mark"
                      />
                    </div>
                    <div className="text-xs text-gray-500 flex flex-row gap-x-2">
                      <Link href={`/blog`} className="hover:underline" target="_blank">Blog</Link>
                      <Link href={`/legal/terms-of-service`} className="hover:underline" target="_blank">Terms</Link>
                      <Link href={`/legal/privacy-policy`} className="hover:underline" target="_blank">Privacy</Link>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      )}
    </Transition.Root>
  )
}