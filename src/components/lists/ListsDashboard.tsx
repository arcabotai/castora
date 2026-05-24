'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useInfiniteQuery, useQuery } from 'react-query'
import { Bars3Icon, PlusIcon, LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import MyListPreviewRow from './MyListPreviewRow'
import ExploreListPreviewRow from './ExploreListPreviewRow'
import { useSelectedList } from '@/providers/SelectedListProvider'
import { useMobileSidebar } from '@/providers/MobileSidebarProvider'
import { HOST_URL } from '@/utils/hostURL'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import FeedHeader from '../FeedHeader'
import { Button } from '../ui/button'
import { toast } from 'sonner'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Loader2 } from "lucide-react"
import ListDetail from './ListDetail'
import { Skeleton } from '../ui/skeleton'
import { useInView } from 'react-intersection-observer'

type TabType = 'myLists' | 'discover';

const ListRowSkeleton = () => (
  <div className="flex items-center space-x-4 py-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px]" />
    </div>
  </div>
)

export default function ListsDashboard() {
  const { supercastUserState } = useSupercastUserState()
  const { ready, authenticated, getAccessToken } = usePrivy()
  const { editedList, setEditedList } = useSelectedList()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const [activeTab, setActiveTab] = useState<TabType>('discover')
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { ref, inView } = useInView()

  const fetchMyLists = async () => {
    const accessToken = await getAccessToken()
    const response = await axios.get(`${HOST_URL}/api/lists/my-lists`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
    return response.data.lists
  }

  const queryKey = `myLists-${supercastUserState.currentFid}`

  const myListsQuery = useQuery(queryKey, fetchMyLists, {
    enabled: !!supercastUserState.currentFid && ready && authenticated,
    staleTime: 60000, // 1 minute
  })

  const fetchDiscoverLists = async ({ pageParam = 1 }) => {
    const accessToken = await getAccessToken()
    const response = await axios.get(`${HOST_URL}/api/lists/explore`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      },
      params: {
        page: pageParam,
        limit: 20,
      }
    })
    return response.data
  }

  const discoverListsQuery = useInfiniteQuery(
    [`discoverLists-${supercastUserState.currentFid}`, activeTab],
    fetchDiscoverLists,
    {
      enabled: activeTab === 'discover' && !!supercastUserState.currentFid && ready && authenticated,
      getNextPageParam: (lastPage) => {
        if (lastPage.pagination.page < lastPage.pagination.totalPages) {
          return lastPage.pagination.page + 1
        }
        return undefined
      },
      staleTime: 300000, // 5 minutes
    }
  )

  useEffect(() => {
    if (inView && hasMore && !discoverListsQuery.isFetching) {
      discoverListsQuery.fetchNextPage()
    }
  }, [inView, hasMore, discoverListsQuery])

  useEffect(() => {
    if (discoverListsQuery.data) {
      const lastPage = discoverListsQuery.data.pages[discoverListsQuery.data.pages.length - 1]
      setHasMore(lastPage.pagination.page < lastPage.pagination.totalPages)
    }
  }, [discoverListsQuery.data])

  const handleListCreate = async () => {
    setIsCreatingList(true)
    const accessToken = await getAccessToken()
    try {
      const response = await axios.post(`${HOST_URL}/api/lists`, {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'asFid': supercastUserState.currentFid,
        }
      })
      const newList = response.data.list
      setEditedList(newList) // Open the new list immediately
      myListsQuery.refetch()
    } catch (error) {
      console.error(error)
      toast.error('Failed to create new list')
    } finally {
      setIsCreatingList(false)
    }
  }

  const handleListSelect = (list) => {
    setEditedList(list)
  }

  const renderContent = () => {
    const query = activeTab === 'myLists' ? myListsQuery : discoverListsQuery;

    if (query.isLoading) {
      return (
        <ul className='flex flex-col w-full divide-y px-4 sm:px-6 lg:px-8 dark:divide-gray-700'>
          {[...Array(5)].map((_, index) => (
            <li key={index}>
              <ListRowSkeleton />
            </li>
          ))}
        </ul>
      )
    }

    if (query.isError) {
      return <div className='flex flex-row justify-center py-3'>
        <span className='text-red-500 text-sm'>Error loading lists</span>
      </div>
    }

    if (query.data) {
      const lists = activeTab === 'myLists'
        ? query.data
        : query.data.pages.flatMap(page => page.lists);

      if (lists.length > 0) {
        return (
          <ul className='flex flex-col w-full divide-y px-4 sm:px-6 lg:px-8 dark:divide-gray-700'>
            {lists.map((list) => (
              <li key={list.id} onClick={() => handleListSelect(list)} className="lg:hover:bg-gray-50 lg:dark:hover:bg-gray-800 cursor-pointer">
                {activeTab === 'myLists' ? <MyListPreviewRow list={list} /> : <ExploreListPreviewRow list={list} />}
              </li>
            ))}
            {activeTab === 'discover' && hasMore && (
              <li ref={ref} className="py-4">
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              </li>
            )}
          </ul>
        )
      }
    }

    return (
      <div className='flex flex-row justify-center py-3'>
        <span className='text-gray-500 text-sm'>
          {activeTab === 'myLists' ? "You don't have any lists yet" : "No lists to discover at the moment"}
        </span>
      </div>
    )
  }

  const createButton = (
    <Button
      onClick={handleListCreate}
      size={isDesktop ? "sm" : "icon"}
      className={`flex flex-row items-center justify-center gap-x-2 h-8 shadow-sm ${!isDesktop ? 'w-8 rounded-full lg:hidden' : 'px-8'}`}
      disabled={isCreatingList}
    >
      {isDesktop && "Create"}
      {isCreatingList ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <PlusIcon className="h-5 w-5" />
      )}
    </Button>
  )

  return (
    <div className="pt-12 lg:pt-0">
      <FeedHeader
        title="Lists"
        rightAction={createButton}
      />
      <div className="flex justify-between gap-x-2 sm:gap-x-4 px-4 sm:px-6 lg:px-8 py-2">
        <Button
          variant={activeTab === 'discover' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setActiveTab('discover')}
        >
          Discover
        </Button>
        <Button
          variant={activeTab === 'myLists' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setActiveTab('myLists')}
        >
          My lists
        </Button>
      </div>
      <div>
        {renderContent()}
      </div>
    </div>
  )
}
