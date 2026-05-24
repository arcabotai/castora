'use client'
import { useEffect, useRef } from "react"
import { useSearchParams } from 'next/navigation'
import { useInfiniteQuery } from 'react-query'
import axios from "axios"
import { useInView } from 'react-intersection-observer'
import { isMobile } from 'react-device-detect'

import { useMobileSidebar } from '@/providers/MobileSidebarProvider'
import { useSelectedCast } from '@/providers/SelectedCastProvider'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import { HOST_URL } from '@/utils/hostURL'

import CastInFeed from "../CastInFeed"
import SearchBar from "./SearchBar"
import Spinner from "../Spinner"
import PullToRefresh from 'react-simple-pull-to-refresh'
import CastInFeedSkeleton from '../casts/CastInFeedSkeleton'
import SuperChannelTrendingPosts from "../community/SuperChannelTrendingPosts"
import SuperanonRecentPosts from "../community/SuperanonRecentPosts"
import FeedHeader from "../FeedHeader"
import MapPromotionCard from '../map/MapPromotionCard'
import BookmarksCarousel from "../BookmarksCarousel"

export default function Search() {
  const searchParams = useSearchParams()
  const searchTerm = searchParams.get('q') || ''

  const { supercastUserState, isAuthenticated, isRegularUser } = useSupercastUserState()
  const { getAccessToken } = usePrivy()
  const { ref: inViewRef, inView } = useInView()
  const searchTopRef = useRef<HTMLDivElement>(null)

  const fetchSearchResults = async ({ pageParam = '' }) => {
    console.log('fetching search results')
    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/cast/search?sq=${searchTerm}&cursor=${pageParam}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })

    return response.data
  }

  const searchQuery = useInfiniteQuery(
    ['search', searchTerm, supercastUserState.currentFid],
    fetchSearchResults,
    {
      getNextPageParam: (lastPage) => lastPage.cursor,
      enabled: !!searchTerm && isAuthenticated(),
      staleTime: 120000, // 2 minutes
      cacheTime: 120000, // 2 minutes
    }
  )

  useEffect(() => {
    if (inView && searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) {
      searchQuery.fetchNextPage()
    }
  }, [inView, searchQuery.isFetchingNextPage, searchQuery.hasNextPage])

  return (
    <div className="pt-12 lg:pt-0">
      <FeedHeader title="Explore" />
      <div ref={searchTopRef} className="min-h-screen">
        <div className='flex flex-col items-center py-2 px-4 sm:px-6 lg:px-8'>
          <div className='w-full pt-2'>
            <SearchBar />
          </div>
        </div>
        {(!searchQuery.isLoading && !searchQuery.isSuccess) && (
          <div className='flex flex-col gap-y-4 my-4'>
            <MapPromotionCard />
            <SuperChannelTrendingPosts />
            <SuperanonRecentPosts />
            {isRegularUser() && <BookmarksCarousel />}
          </div>
        )}
        <div>
          {searchQuery.isLoading ? (
            <ul>
              {[...Array(10)].map((_, index) => (
                <li key={index} className='px-4 sm:px-6 lg:px-8 border-b dark:border-gray-800'>
                  <CastInFeedSkeleton />
                </li>
              ))}
            </ul>
          ) : (
            <ul>
              {searchQuery.isSuccess && (
                searchQuery.data.pages.map((page, pageIndex) => (
                  page.casts.map((cast: any, castIndex) => (
                    <li
                      key={cast.hash}
                      className="px-4 sm:px-6 lg:px-8 sm:hover:bg-gray-50 hover:cursor-pointer border-b dark:border-gray-800 sm:dark:hover:bg-gray-800"
                    >
                      {castIndex === 7 && (<div ref={inViewRef} className="h-1"></div>)}
                      <CastInFeed cast={cast} />
                    </li>
                  ))
                ))
              )}
            </ul>
          )}
          {(searchQuery.isSuccess && searchQuery.data.pages.length === 1 && searchQuery.data.pages[0].casts.length === 0) && (
            <div className="flex flex-col items-center justify-center w-full pt-6">
              <p className='text-gray-500 text-sm'>No results found</p>
            </div>
          )}
          {searchQuery.isFetchingNextPage && <Spinner padding='py-4' />}
        </div>
      </div>
    </div>
  )
}
