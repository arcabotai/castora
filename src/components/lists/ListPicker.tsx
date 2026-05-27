import { Fragment, useState, useEffect } from 'react'
import axios from 'axios'
import { ListBulletIcon } from '@heroicons/react/20/solid'
import { classNames } from '@/utils/classNames'
import { useSelectedList } from '@/providers/SelectedListProvider'
import { HOST_URL } from '@/utils/hostURL'
import Link from 'next/link'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerTrigger } from '../ui/drawer'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Switch } from '../ui/switch'
import { useQuery } from 'react-query'

type List = {
  id: string
  name: string
  authorFid: number
  followingCount: number
  membershipCount: number
}

export default function ListPicker() {

  const followingList = {
    id: "following",
    name: "Following",
    authorFid: 0,
    followingCount: 0,
    membershipCount: 0,
  }

  const trendingList = {
    id: "trending",
    name: "Trending",
    authorFid: 0,
    followingCount: 0,
    membershipCount: 0,
  }

  const forYouFeed = {
    id: "foryou",
    name: "For you",
    authorFid: 0,
    followingCount: 0,
    membershipCount: 0,
  }

  const featuredList = {
    id: process.env.NEXT_PUBLIC_FEATURED_LIST_ID,
    name: "Featured",
    authorFid: 0,
    followingCount: 0,
    membershipCount: 0,
  }

  const anonFeed = {
    id: "anon",
    name: "Super anon",
    authorFid: 0,
    followingCount: 0,
    membershipCount: 0,
  }

  const { selectedList, setSelectedList, includeRecast, setIncludeRecast } = useSelectedList()
  const { supercastUserState, isGuest, isRegularUser } = useSupercastUserState()
  const { getAccessToken, ready: readyPrivy } = usePrivy()

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const defaultLists = isGuest() ? [trendingList, anonFeed] : [followingList, trendingList, anonFeed]
  const [lists, setLists] = useState(defaultLists)

  const fetchLists = async () => {

    const accessToken = await getAccessToken()

    return axios.get(`${HOST_URL}/api/lists`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
      .then((response) => {
        return response.data.lists
      })
  }

  const listsQuery = useQuery(
    ['lists', supercastUserState.currentFid],
    fetchLists,
    {
      enabled: readyPrivy && (isGuest() || isRegularUser()),
      staleTime: 120000, // 2 minutes
    }
  )

  useEffect(() => {
    if (listsQuery.data) {
      setLists([...defaultLists, ...listsQuery.data])
    }
  }, [listsQuery.data])

  useEffect(() => {
    const savedSelectedList = localStorage.getItem('selectedList')
    if (!!savedSelectedList) {
      setSelectedList(JSON.parse(savedSelectedList))
    } else {
      setSelectedList(featuredList)
    }
  }, [])

  const handleListSelect = (list: List) => {
    setSelectedList(list)
    localStorage.setItem('selectedList', JSON.stringify(list))
    setIsDrawerOpen(false)
  }

  const handleIncludeRecastChange = (checked: boolean) => {
    setIncludeRecast(checked);
    setIsDrawerOpen(false);
  };

  const showIncludeRecastsSwitch = !['following', 'foryou', 'trending'].includes(selectedList?.id || '');

  return (
    <>
      {/* Desktop version */}
      <div className="hidden lg:block">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex w-32 justify-center gap-x-1.5 rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100 border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
            {selectedList?.name || 'Select list'}
          </DropdownMenuTrigger>
          <DropdownMenuContent className='dark:bg-gray-900'>
            {lists.map((list) => (
              <DropdownMenuItem
                key={list.id}
                onSelect={() => handleListSelect(list)}
                className='px-2 py-1 cursor-pointer'
              >
                {list.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {showIncludeRecastsSwitch && (
              <DropdownMenuItem className="px-2 py-1 text-sm">
                <div className="flex items-center justify-between gap-x-2">
                  <span>Include recasts</span>
                  <Switch
                    checked={includeRecast}
                    onCheckedChange={handleIncludeRecastChange}
                  />
                </div>
              </DropdownMenuItem>
            )}
            {isRegularUser() &&
              <DropdownMenuItem>
                <Link
                  href="/lists"
                  className='px-2 py-1 cursor-pointer font-medium'
                >
                  Manage lists
                </Link>
              </DropdownMenuItem>
            }
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile version */}
      <div className="lg:hidden">
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger className='w-10 h-10 flex items-center justify-center active:scale-90 transition-all duration-150 ease-in-out'>
            <div className="w-8 h-8 rounded-full bg-transparent border border-gray-300 dark:border-gray-600 flex items-center justify-center">
              <ListBulletIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
          </DrawerTrigger>
          <DrawerContent>
            <div className="px-4">
              <div className="space-y-2">
                <ScrollArea className={`max-h-[200px] border-b border-gray-300 dark:border-gray-600 ${lists.length > 5 ? 'overflow-y-auto' : ''}`}>
                  {lists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => handleListSelect(list)}
                      className="w-full text-left px-4 py-3 text-sm rounded-md"
                    >
                      {list.name}
                    </button>
                  ))}
                </ScrollArea>
              </div>
            </div>
            <DrawerFooter>
              {showIncludeRecastsSwitch && (
                <div className='px-4 py-1 flex flex-col gap-2'>
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-sm">Include Recasts</span>
                    <Switch
                      checked={includeRecast}
                      onCheckedChange={handleIncludeRecastChange}
                    />
                  </div>
                </div>
              )}
              {isRegularUser() &&
                <Button className='w-full'>
                  <Link
                    href="/lists"
                    className=""
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    Manage lists
                  </Link>
                </Button>
              }
              <DrawerClose>
                <Button variant='secondary' className='w-full'>Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  )
}
