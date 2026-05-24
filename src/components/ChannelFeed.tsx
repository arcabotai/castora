'use client'

import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

import CastInFeed from './CastInFeed'
import { useSelectedCast } from '@/providers/SelectedCastProvider'
import { useMobileSidebar } from '@/providers/MobileSidebarProvider'
import { HOST_URL } from '@/utils/hostURL'
import { isMobile } from 'react-device-detect';
import { useCurrentChannel } from '@/providers/CurrentChannelProvider'
import { useInfiniteQuery, useQuery } from 'react-query'
import Spinner from './Spinner'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import { PaperAirplaneIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { useDraftComposeWindow } from '@/providers/DraftComposeWindowProvider'
import { useDraftId } from '@/providers/DraftIdProvider'
import { useInView } from 'react-intersection-observer';
import { formatNumber } from '@/utils/textUtils'
import { Button } from './ui/button'
import CastInFeedSkeleton from './casts/CastInFeedSkeleton'
import PullToRefresh from 'react-simple-pull-to-refresh';
import FeedHeader from './FeedHeader';
import SearchBar from './search/SearchBar'
import { Loader2 } from 'lucide-react'
import { AspectRatio } from './ui/aspect-ratio'
import CastText from './casts/CastText'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSuperLogin } from '@/hooks/useSuperLogin'

export default function ChannelFeed({ channel_id }: { channel_id: string }) {
  const { setHash } = useSelectedCast()
  const { setOpenDraftComposeWindow, setInitialText, setInitialEmbeds, setInitialRecastId } = useDraftComposeWindow()
  const { setDraftId } = useDraftId()
  const { supercastUserState, isAuthenticated, isGuest } = useSupercastUserState()
  const { ready, authenticated, getAccessToken } = usePrivy()
  const { ref: inViewRef, inView } = useInView();
  const feedTopRef = useRef<HTMLDivElement>(null);

  const router = useRouter()
  const { login } = useSuperLogin()

  const fetchCurrentChannel = async () => {
    const response = await axios.get(`${HOST_URL}/api/channels/${channel_id}`, {
      headers: {
        'asFid': supercastUserState.currentFid,
      }
    })
    return response.data.channel
  }

  const fetchCasts = async ({ pageParam = '' }) => {
    const accessToken = await getAccessToken()
    const response = await axios.get(`${HOST_URL}/api/channels/${channel_id}/feed?cursor=${pageParam}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
    return response.data
  }

  const channelInfoQuery = useQuery(
    ['channelInfo', channel_id],
    fetchCurrentChannel,
    {
      enabled: !!channel_id && !!supercastUserState,
    }
  )

  const channelFeedQuery = useInfiniteQuery(
    ['feed', channel_id, supercastUserState],
    fetchCasts,
    {
      getNextPageParam: (lastPage) => lastPage.cursor,
      enabled: !!channel_id && !!supercastUserState && ready,
      staleTime: 120000, // 2 minutes
    }
  )

  useEffect(() => {
    if (inView && channelFeedQuery.hasNextPage && !channelFeedQuery.isFetchingNextPage) {
      channelFeedQuery.fetchNextPage();
    }
  }, [inView, channelFeedQuery.isFetchingNextPage, channelFeedQuery.hasNextPage]);

  useEffect(() => {
    setHash("")
  }, [channel_id])

  const refreshHandler = async (): Promise<void> => {
    return channelFeedQuery.refetch().then(() => { });
  }

  const handleCastButtonClick = () => {

    if (!isAuthenticated()) {
      login()
      return
    }

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
    <div id='channel-feed' ref={feedTopRef} className='w-full pt-12 lg:pt-0'>
      <div className='lg:hidden'>
        <FeedHeader
          title={channelInfoQuery.data ? `/${channelInfoQuery.data.id}` : ""}
        />
      </div>
      <div className='hidden lg:block'>
        <FeedHeader
          title={channelInfoQuery.data ? `/${channelInfoQuery.data.id}` : ""}
          rightAction={
            isAuthenticated() && authenticated && (
              <Button
                onClick={handleCastButtonClick}
                size="sm"
                className='flex flex-row items-center justify-center gap-x-2 px-8 h-8 shadow-sm'
              >
                Cast
                <PaperAirplaneIcon className='h-4 w-4' />
              </Button>
            )
          }
        />
      </div>
      {channelInfoQuery.data && (
        <div className='flex flex-col w-full border-b dark:border-gray-800'>
          <AspectRatio ratio={3 / 1}>
            {channelInfoQuery.data?.header_image_url ? (
              <img src={channelInfoQuery.data.header_image_url} alt="Channel image" className="w-full h-full object-cover" />
            ) : (
              <div className='w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse' />
            )}
          </AspectRatio>
          <div className='flex flex-col gap-y-2 px-4 py-2'>
            <div className='flex flex-row justify-between gap-x-3 items-center'>
              <img src={channelInfoQuery.data.image_url} alt="Channel image" className="-mt-12 bg-white dark:bg-gray-800 z-50 w-24 h-24 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm shrink-0" />
              <div className='flex flex-row gap-x-2 text-sm text-gray-500 dark:text-gray-400'>
                <p><span className='font-semibold text-gray-900 dark:text-gray-100'>{formatNumber(channelInfoQuery.data.member_count)}</span> members</p>
                <p><span className='font-semibold text-gray-900 dark:text-gray-100'>{formatNumber(channelInfoQuery.data.follower_count)}</span> followers</p>
              </div>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">/{channelInfoQuery.data.id}</h1>
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              <CastText text={channelInfoQuery.data.description} />
            </div>
            <div className='flex flex-row gap-x-2 text-xs text-gray-500 dark:text-gray-400 w-full'>
              <p><span className='hidden sm:inline'>Started on</span> {
                new Date(Number(channelInfoQuery.data.created_at) * 1000).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })
              }
              </p>
              <p className=''>•</p>
              <div className='flex flex-row gap-x-1 items-center'>
                <p>Owned by:</p>
                <img src={channelInfoQuery.data.lead.pfp_url} alt="Owner image" className="w-4 h-4 rounded-full object-cover shadow-sm shrink-0" />
                <Link href={`/${channelInfoQuery.data.lead.username}`}>
                  <p>@{channelInfoQuery.data.lead.username}</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
      }
      <PullToRefresh
        onRefresh={refreshHandler}
        pullingContent={pullToRefreshContent}
        refreshingContent={<Loader2 className='h-8 w-8 mx-auto animate-spin mt-2' />}
        isPullable={isMobile}
      >
        <ul>
          {channelFeedQuery.isLoading ? (
            renderSkeletons()
          ) : channelFeedQuery.isSuccess ? (
            channelFeedQuery.data.pages.map((page, i) => (
              <React.Fragment key={i}>
                {page.casts.map((cast: any, castIndex) => (
                  <li
                    key={cast.hash}
                    className="px-4 sm:px-6 lg:px-8 sm:hover:bg-gray-50 hover:cursor-pointer border-b dark:border-gray-800 sm:dark:hover:bg-gray-800"
                  >
                    {castIndex === 5 && (<div ref={inViewRef} className="h-1"></div>)}
                    <CastInFeed cast={cast} />
                  </li>
                ))}
              </React.Fragment>
            ))
          ) : null}
          {channelFeedQuery.isFetchingNextPage && renderSkeletons()}
        </ul>
      </PullToRefresh>
    </div >
  )
}
