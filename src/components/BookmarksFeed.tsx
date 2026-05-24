'use client'
import { useEffect, useRef } from 'react'
import axios from 'axios'

import CastInFeed from './CastInFeed'
import { useSelectedCast } from '@/providers/SelectedCastProvider'
import { useMobileSidebar } from '@/providers/MobileSidebarProvider'

import { Cast } from '@/types'
import { HOST_URL } from '@/utils/hostURL'
import { isMobile } from 'react-device-detect';
import { Bars3Icon } from '@heroicons/react/24/outline'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import { useInfiniteQuery } from 'react-query'
import Spinner from './Spinner'
import { useInView } from 'react-intersection-observer';
import CastInFeedSkeleton from './casts/CastInFeedSkeleton'
import FeedHeader from './FeedHeader'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { Loader2 } from 'lucide-react'
import { SUPERANON_ADMIN_FIDS } from '@/utils/anon/admin'
import { notFound } from 'next/navigation'

export default function BookmarksFeed() {
  const { setOpenSidebar } = useMobileSidebar()
  const { setHash } = useSelectedCast()
  const { supercastUserState } = useSupercastUserState()
  const { ready: readyPrivy, authenticated, getAccessToken } = usePrivy()
  const { ref: inViewRef, inView } = useInView();
  const bookmarksTopRef = useRef<HTMLDivElement>(null);

  const isSuperanonNonAdmin = supercastUserState.currentFid === Number(process.env.NEXT_PUBLIC_SUPERANON_FID) && !SUPERANON_ADMIN_FIDS.includes(supercastUserState.userFid)

  if (isSuperanonNonAdmin) {
    return notFound()
  }

  const fetchBookmarks = async ({ pageParam = '' }) => {
    const accessToken = await getAccessToken()
    const response = await axios.get(`${HOST_URL}/api/bookmarks?cursor=${pageParam}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "asFid": supercastUserState.currentFid
      }
    })
    return response.data
  }

  const bookmarkQuery = useInfiniteQuery(
    ['bookmark', supercastUserState.currentFid],
    fetchBookmarks,
    {
      getNextPageParam: (lastPage) => lastPage.cursor,
      enabled: supercastUserState.currentFid !== 0 && readyPrivy && authenticated,
    }
  )

  useEffect(() => {
    if (inView && !bookmarkQuery.isFetchingNextPage && bookmarkQuery.hasNextPage) {
      bookmarkQuery.fetchNextPage()
    }
  }, [inView, bookmarkQuery.isFetchingNextPage, bookmarkQuery.hasNextPage]);

  useEffect(() => {
    setHash("")
  }, [])

  const refreshHandler = async (): Promise<void> => {
    return bookmarkQuery.refetch().then(() => { });
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

  const pullToRefreshContent = (
    <div className='flex flex-row items-center justify-center gap-x-2 pt-2 animate-pulse text-gray-500 text-sm'>
      <p>Pull to refresh</p>
    </div>
  )

  return (
    <div ref={bookmarksTopRef} className="pt-12 lg:pt-0">
      <FeedHeader title="Bookmarks" />
      <div>
        {bookmarkQuery.isLoading ? (
          renderSkeletons()
        ) : bookmarkQuery.isSuccess ? (
          <PullToRefresh
            onRefresh={refreshHandler}
            pullingContent={pullToRefreshContent}
            refreshingContent={<Loader2 className='h-8 w-8 mx-auto animate-spin mt-2' />}
            isPullable={isMobile}
          >
            <ul>
              {bookmarkQuery.data.pages.map((page, i) => (
                page.casts.map((cast: any, castIndex) => (
                  <li
                    key={cast.hash}
                    className="px-4 sm:px-6 lg:px-8 sm:hover:bg-gray-50 hover:cursor-pointer border-b dark:border-gray-800 sm:dark:hover:bg-gray-800"
                  >
                    {castIndex === 5 && (<div ref={inViewRef} className="h-1"></div>)}
                    <CastInFeed cast={cast} />
                  </li>
                ))
              ))}
            </ul>
          </PullToRefresh>
        ) : (
          <div className='flex flex-row justify-center py-3'>
            <span className='text-gray-500 text-sm'>Error fetching bookmarks</span>
          </div>
        )}
        {bookmarkQuery.isFetchingNextPage && renderSkeletons()}
      </div>
    </div>
  )
}