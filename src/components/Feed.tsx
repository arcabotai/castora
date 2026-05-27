'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import axios from 'axios'
import CastInFeed from './CastInFeed'
import { useSelectedCast } from '@/providers/SelectedCastProvider'
import { useSelectedList } from '@/providers/SelectedListProvider'
import ListPicker from './lists/ListPicker'
import { HOST_URL } from '@/utils/hostURL'
import { isMobile } from 'react-device-detect';
import SearchBar from './search/SearchBar'
import { useInfiniteQuery } from 'react-query'
import Spinner from './Spinner'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import { PaperAirplaneIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import { useDraftComposeWindow } from '@/providers/DraftComposeWindowProvider'
import { useDraftId } from '@/providers/DraftIdProvider'
import PullToRefresh from 'react-simple-pull-to-refresh';
import { useInView } from 'react-intersection-observer';
import { useFeedRefresh } from '@/providers/FeedRefreshProvider';
import FeedHeader from './FeedHeader';
import { Button } from './ui/button'
import { useNotifications } from '@/providers/NotificationsProvider'
import CastInFeedSkeleton from './casts/CastInFeedSkeleton' // Add this import
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerTrigger } from './ui/drawer'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Feed() {
  const { supercastUserState, isAuthenticated, isGuest, isRegularUser } = useSupercastUserState()
  const { setHash, navigateToCast } = useSelectedCast()
  const { setOpenDraftComposeWindow, setInitialText, setInitialEmbeds, setInitialRecastId } = useDraftComposeWindow()
  const { draftId, setDraftId } = useDraftId()
  const { selectedList, includeRecast } = useSelectedList()
  const { ready, authenticated, getAccessToken } = usePrivy()
  const { ref: inViewRef, inView } = useInView();
  const [currentCastIndex, setCurrentCastIndex] = useState(-1);
  const feedTopRef = useRef<HTMLDivElement>(null);
  const prevListIdRef = useRef<string | null>(null);
  const { setRefreshFunction } = useFeedRefresh();
  const { notificationsQuery } = useNotifications()
  const [showSearch, setShowSearch] = useState(false);
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);

  const router = useRouter();

  const listId = selectedList?.id || "foryou"
  const regularUser = isRegularUser()

  const fetchCasts = async ({ pageParam = '' }) => {

    const accessToken = await getAccessToken()

    return axios.get(`${HOST_URL}/api/feed?cursor=${pageParam}&listID=${listId}&include_recasts=${includeRecast}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
      .then((response) => {
        return response.data
      })
  }

  const feedQuery = useInfiniteQuery(
    ['feed', listId, supercastUserState.currentFid, includeRecast],
    fetchCasts,
    {
      getNextPageParam: (lastPage) => lastPage.cursor,
      enabled: isAuthenticated() && !!supercastUserState,
      staleTime: 120000, // 2 minutes
    }
  )

  useEffect(() => {
    if (inView && feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
      feedQuery.fetchNextPage();
    }
  }, [
    inView, feedQuery.isFetchingNextPage, feedQuery.hasNextPage,
  ]);

  useEffect(() => {
    setHash("")
  }, [])

  useEffect(() => {
    if (regularUser) {
      notificationsQuery.refetch()
    }
  }, [regularUser])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return; // Do nothing if user is typing in an input or textarea
      }
      if (event.key === 'j') {
        setCurrentCastIndex((prevIndex) => Math.min(prevIndex + 1, getTotalCastsCount() - 1));
      } else if (event.key === 'k') {
        setCurrentCastIndex((prevIndex) => Math.max(prevIndex - 1, 0));
      } else if (event.key === 'Enter') {
        const currentCast = feedQuery.data?.pages.flatMap(page => page.casts)[currentCastIndex];
        if (currentCast) {
          navigateToCast(event, currentCast.hash);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentCastIndex, feedQuery.data, setHash]);

  useEffect(() => {
    if (currentCastIndex >= 0 && currentCastIndex < getTotalCastsCount()) {
      const castElement = document.getElementById(`cast-${currentCastIndex}`);
      if (castElement) {
        castElement.scrollIntoView({ behavior: 'instant', block: 'start' });
        window.scrollBy(0, -80);
      }
    }
  }, [currentCastIndex]);

  useEffect(() => {
    setRefreshFunction(async () => {
      notificationsQuery.refetch()
      feedTopRef.current?.scrollIntoView({ behavior: 'smooth' })
      await feedQuery.refetch()
    })
  }, [setRefreshFunction, feedQuery])

  const refreshHandler = async (): Promise<void> => {
    notificationsQuery.refetch()
    return feedQuery.refetch().then(() => { });
  }

  const getTotalCastsCount = () => {
    return feedQuery.data?.pages.reduce((total, page) => total + page.casts.length, 0) || 0;
  }

  const toggleSearch = () => {
    setIsSearchDrawerOpen(!isSearchDrawerOpen);
  };

  const handleCastButtonClick = () => {
    if (isGuest()) {
      router.push('/onboarding')
      return
    }

    setDraftId(null)
    setInitialText('')
    setInitialEmbeds([])
    setInitialRecastId(null)
    setOpenDraftComposeWindow(true)
  }

  const searchButton = (
    <Drawer open={isSearchDrawerOpen} onOpenChange={setIsSearchDrawerOpen}>
      <DrawerTrigger asChild>
        <Button
          onClick={toggleSearch}
          size="icon"
          variant="outline"
          className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
        >
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="w-full h-[550px]">
        <div className="p-4">
          <SearchBar />
        </div>
        <DrawerFooter>
          <DrawerClose>
            <Button variant='secondary' className='w-full'>Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );

  // Add this new useEffect
  useEffect(() => {
    if (feedQuery.data && feedQuery.data.pages.length > 0 && selectedList?.id !== prevListIdRef.current) {
      feedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
      prevListIdRef.current = selectedList?.id || null;
    }
  }, [selectedList, feedQuery.data]);

  const pullToRefreshContent = (
    <div className='flex flex-row items-center justify-center gap-x-2 pt-2 animate-pulse text-gray-500 text-sm'>
      <p>Pull to refresh</p>
    </div>
  )

  const renderCastList = (casts: any[], pageIndex: number) => {
    return casts.map((cast: any, castIndex) => {
      const globalIndex = pageIndex * 10 + castIndex;
      return (
        <li
          key={cast.hash}
          id={`cast-${globalIndex}`}
          className={`px-4 sm:px-6 lg:px-8 sm:hover:bg-gray-50 hover:cursor-pointer border-b dark:border-gray-800 sm:dark:hover:bg-gray-800 ${globalIndex === currentCastIndex ? 'bg-gray-100 dark:bg-gray-800' : ''
            }`}
        >
          {castIndex === 5 && <div ref={inViewRef} className="h-1" />}
          <CastInFeed cast={cast} isSelected={globalIndex === currentCastIndex} />
        </li>
      );
    });
  };

  const renderSkeletons = (count: number = 10) => {
    return Array(count)
      .fill(null)
      .map((_, index) => (
        <li key={`skeleton-${index}`} className="px-4 sm:px-6 lg:px-8 border-b dark:border-gray-800">
          <CastInFeedSkeleton />
        </li>
      ));
  };

  return (
    <div id='feed' ref={feedTopRef} className='w-full pt-12 lg:pt-0 relative'>
      <div className='lg:hidden'>
        <FeedHeader
          title={selectedList?.name}
          rightAction={
            <ListPicker />
          }
          rightAction2={searchButton}
        />
      </div>
      <div className='hidden lg:block fixed z-10 lg:w-1/2 lg:max-w-[638px]'>
        <FeedHeader
          leftAction={
            <ListPicker />
          }
          rightAction={
            <Button
              onClick={handleCastButtonClick}
              size='sm'
              className='flex flex-row items-center justify-center gap-x-2 px-8 h-8 shadow-sm'
            >
              Cast
              <PaperAirplaneIcon className='h-4 w-4' />
            </Button>
          }
        />
      </div>
      <div className={`transition-all duration-300 ease-in-out ${showSearch ? 'mt-2 max-h-96' : 'max-h-0 overflow-hidden'} px-4`}>
        <SearchBar />
      </div>
      <PullToRefresh
        onRefresh={refreshHandler}
        pullingContent={pullToRefreshContent}
        refreshingContent={<Loader2 className="h-8 w-8 mx-auto animate-spin mt-2" />}
        isPullable={isMobile}
      >
        <ul className="lg:pt-12">
          {feedQuery.data?.pages.map((page, pageIndex) => renderCastList(page.casts, pageIndex))}

          {(feedQuery.isLoading || feedQuery.isFetchingNextPage) && renderSkeletons()}

          {feedQuery.isSuccess &&
            feedQuery.data.pages.length === 1 &&
            feedQuery.data.pages[0].casts.length === 0 && (
              <div className="flex flex-col items-center justify-center w-full pt-6">
                {selectedList?.id ? (
                  <p className="text-gray-500 text-sm">Users from this list haven't casted yet</p>
                ) : (
                  <p className="text-gray-500 text-sm">You are not following anyone yet</p>
                )}
              </div>
            )}
        </ul>
      </PullToRefresh>
    </div>
  )
}
