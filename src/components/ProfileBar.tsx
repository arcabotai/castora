import { Fragment, useEffect, useState } from "react"
import { Menu, Transition } from '@headlessui/react'
import Link from "next/link"
import axios from "axios"

import { classNames } from "@/utils/classNames"
import { PlusIcon, StarIcon, UserPlusIcon } from "@heroicons/react/24/solid"
import { UserMin } from "@/types"
import { Cog8ToothIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline"

import Image from "next/image"
import { truncateLongWord } from "@/utils/textUtils"
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider"
import { useLogin, usePrivy } from "@privy-io/react-auth"
import { UserCircleIcon } from "@heroicons/react/24/solid"
import { HOST_URL } from "@/utils/hostURL"
import { AUTH_URL } from "@/utils/authURL"
import Spinner from "./Spinner"
import { useDisconnect } from 'wagmi'
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Skeleton } from "./ui/skeleton"
import { Button } from "./ui/button"
import { ChevronRight } from "lucide-react"
import { useSupercastMember } from "@/providers/SupercastMemberProvider"
import SupercastBadge from "./SupercastBadge"
import { useSuperLogin } from "@/hooks/useSuperLogin"

export default function ProfileBar() {

  const { supercastUserState, getCurrentProfile, switchAccount, isAuthenticated, isGuest } = useSupercastUserState()
  const { getAccessToken } = usePrivy()
  const [loadingConnectSession, setLoadingConnectSession] = useState<boolean>(false)
  const { isSupercastMember } = useSupercastMember();

  const currentAccount = getCurrentProfile()

  const { disconnect } = useDisconnect()
  const { login } = useSuperLogin()

  const handleAddAccount = async () => {

    alert('Temporarily unavailable, coming back soon!')
    return

    setLoadingConnectSession(true)
    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/account/create-connection`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'asFid': supercastUserState.userFid
      }
    }).then((response) => {
      const sessionId = response.data.connectionSession
      window.location.href = `${AUTH_URL}?sessionId=${sessionId}`
    }).finally(() => {
      setLoadingConnectSession(false)
    })
  }

  const handleSwitchAccount = (fid: number) => {
    switchAccount(fid)
    disconnect()
  }

  if (!isAuthenticated()) {
    return <Button
      className='w-full'
      onClick={login}
    >
      Get started
      <ChevronRight className="h-5 w-5 ml-1" />
    </Button>
  }

  if (isGuest()) {
    return <Link href="/onboarding">
      <Button
        className='w-full'
      >
        Create profile
        <ChevronRight className="h-5 w-5 ml-1" />
      </Button>
    </Link>
  }

  return (
    <Menu
      as="div"
      className="bottom-4 text-sm font-medium text-gray-900 w-full shrink-0"
    >
      <Menu.Button className="w-full">
        <div className='flex flex-row items-center rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-2 w-full'>
          <Avatar className='h-10 w-10 mr-2'>
            <AvatarImage
              src={currentAccount?.avatar}
              alt='Profile picture'
            />
            <AvatarFallback>
              <Skeleton
                className="h-10 w-10"
              />
            </AvatarFallback>
          </Avatar>
          {currentAccount &&
            <div className="flex flex-col items-start">
              <div className="flex flex-row gap-x-1 items-center">
                <span className="text-gray-900 dark:text-gray-100 font-semibold -mb-0.5 truncate">{currentAccount?.displayName ? truncateLongWord(currentAccount?.displayName, 15) : "New user"}</span>
                {isSupercastMember(currentAccount.fid) && <SupercastBadge />}
              </div>
              <span className="text-gray-500 text-sm font-light">@{currentAccount?.username}</span>
            </div>
          }
        </div>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute bottom-20 z-10 origin-bottom rounded-md bg-white dark:bg-gray-800 shadow-sm ring-1 ring-black ring-opacity-5 focus:outline-none">
          <Menu.Item key={'add-account'}>
            {({ active }) => (
              <button
                onClick={() => { handleAddAccount() }}
                className={classNames(
                  active ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100 rounded-t-md' : 'text-gray-700 dark:text-gray-100',
                  'px-4 py-2 text-sm w-full text-left flex flex-row items-center font-semibold'
                )}
              >
                {loadingConnectSession ?
                  <Spinner height="h-5" width="w-5" padding="p-0" />
                  :
                  <UserPlusIcon className="w-5 h-5 mr-2" />
                }
                {"Add account"}
              </button>
            )}
          </Menu.Item>
          <div className="flex flex-col max-h-[400px] overflow-auto">
            {supercastUserState.accounts.map((account) => (
              <Menu.Item key={account.fid}>
                {({ active }) => (
                  account.fid === supercastUserState.currentFid
                    ?
                    <Link
                      href={`/${account.username}`}
                      className='flex flex-row w-[272px] lg:w-48 items-center hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-2 group/row hover:cursor-pointer'
                    >
                      <Avatar className='h-10 w-10 mr-2'>
                        <AvatarImage
                          src={currentAccount?.avatar}
                          alt='Profile picture'
                        />
                        <AvatarFallback>
                          <Skeleton
                            className="h-10 w-10"
                          />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start flex-grow">
                        <div className="flex flex-row gap-x-1 items-center">
                          <span className="text-gray-900 dark:text-gray-100 font-semibold -mb-0.5 truncate">{account.displayName ? truncateLongWord(account?.displayName, 15) : "New user"}</span>
                        </div>
                        <span className="text-gray-500 text-sm font-light">@{account.username}</span>
                      </div>
                    </Link>
                    :
                    <div
                      onClick={() => handleSwitchAccount(account.fid)}
                      className='flex flex-row w-[272px] lg:w-48 items-center hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-2 group/row hover:cursor-pointer'
                    >
                      <Avatar className='h-10 w-10 mr-2'>
                        <AvatarImage
                          src={account.avatar}
                          alt='Profile picture'
                        />
                        <AvatarFallback>
                          <Skeleton
                            className="h-10 w-10"
                          />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start flex-grow">
                        <div className="flex flex-row gap-x-1 items-center">
                          <span className="text-gray-900 dark:text-gray-100 font-semibold -mb-0.5">{account.displayName ? truncateLongWord(account?.displayName, 15) : "New user"}</span>
                        </div>
                        <span className="text-gray-500 text-sm font-light">@{account.username}</span>
                      </div>
                    </div>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}