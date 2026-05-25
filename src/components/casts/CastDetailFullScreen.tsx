'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { Skeleton } from "../ui/skeleton"

import ReplyTextArea from '@/components/ReplyTextArea'
import Recast from '../casts/Recast'
import URLPreviewCard from '../casts/URLPreview'

import { getTimeSinceTimestamp, parentURLToChannelName, parentURLToChannelId } from '@/utils/textUtils'

import ReplyPreview from '../ReplyPreview'
import { HOST_URL } from '@/utils/hostURL'
import AncestorCast from '../casts/AncestorCast'
import ReactionBar from '../casts/ReactionBar'
import { isMobile } from 'react-device-detect'
import Image from 'next/image'
import CastOptions from '../casts/CastOptions'
import { useDeletedCast } from '@/providers/DeletedCastsProvider'
import DeletedCast from '../casts/DeletedCast'
import ThreadChildCast from '../casts/ThreadChild'
import CastText from '../casts/CastText'
import { useQuery } from 'react-query'
import ProfileHoverCard from '../profile/ProfileHoverCard'
import PowerBadge from '../PowerBadge'
import FarcasterFrame from '../casts/FarcasterFrame'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import CastoraBadge from '../CastoraBadge'
import { useSupercastMember } from '@/providers/SupercastMemberProvider'
import Spinner from '../Spinner'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { useSelectedCast } from '@/providers/SelectedCastProvider'
import CastEmbeds from './CastEmbeds'
import PullToRefresh from 'react-simple-pull-to-refresh';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import CastDetailSkeleton from './CastDetailSkeleton'
import FollowButton from '../profile/FollowButton'
import { Button } from '../ui/button'
import { Loader2 } from 'lucide-react'


export default function CastDetailFullScreen() {

  const { hash: castHash, setHash, navigateToCast } = useSelectedCast()

  const [cast, setCast] = useState<any>()
  const [replies, setReplies] = useState([])
  const [repliesBelowFold, setRepliesBelowFold] = useState([])
  const [ancestorCasts, setAncestorCasts] = useState([])
  const [threadChildren, setThreadChildren] = useState([])

  const [showRepliesBelowFold, setShowRepliesBelowFold] = useState(false)

  const [reactionStatus, setReactionStatus] = useState(false)
  const [recastStatus, setRecastStatus] = useState(false)
  const [bookmarkStatus, setBookmarkStatus] = useState(false)
  const [reactionCount, setReactionCount] = useState(0)
  const [recastCount, setRecastCount] = useState(0)
  const [bookmarkCount, setBookmarkCount] = useState(0)

  const { deletedCastMap, setDeletedCastMap } = useDeletedCast()

  const { supercastUserState, isRegularUser, isGuest } = useSupercastUserState()
  const { isSupercastMember } = useSupercastMember();
  const { getAccessToken } = usePrivy()

  const mainContentRef = useRef(null);
  const headerRef = useRef(null);  // New ref for the header

  const fetchCast = async () => {
    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/cast?hash=${castHash}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    });
    return response.data;
  };

  const fetchRepliesBelowFold = async () => {
    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/cast/replies-below-fold?hash=${castHash}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })

    return response.data
  }

  const castDefaultQuery = useQuery(
    ['castFullScreenQuery', castHash, supercastUserState],
    fetchCast,
    {
      enabled: !!castHash,
    }
  );

  const repliesBelowFoldQuery = useQuery(
    ['repliesBelowFold', castHash],
    fetchRepliesBelowFold,
    {
      enabled: !!castHash && (isRegularUser() || isGuest()),
      refetchOnMount: false,
    }
  )

  const onClose = () => {
    setHash('')
    setCast(null)
    setReplies([])
    setAncestorCasts([])
    setThreadChildren([])
    setReactionCount(0)
    setRecastCount(0)
    setBookmarkCount(0)
    setReactionStatus(false)
    setRecastStatus(false)
    setBookmarkStatus(false)
  }

  useEffect(() => {
    if (castDefaultQuery.isSuccess && castDefaultQuery.data?.currentCast) {
      const currentCast = castDefaultQuery.data.currentCast;
      setAncestorCasts(castDefaultQuery.data.ancestorCasts || []);
      setCast(currentCast);
      setReplies(castDefaultQuery.data.replies || []);
      setThreadChildren(castDefaultQuery.data.threadChildren || []);
      setReactionCount(currentCast.reactions.likes_count);
      setRecastCount(currentCast.reactions.recasts_count);
      setReactionStatus(!!supercastUserState.currentFid ? currentCast.viewer_context.liked : false);
      setRecastStatus(!!supercastUserState.currentFid ? currentCast.viewer_context.recasted : false);
    }
  }, [castDefaultQuery.data, castDefaultQuery.isSuccess, supercastUserState.currentFid]);

  useEffect(() => {
    if (repliesBelowFoldQuery.isSuccess) {
      setRepliesBelowFold(repliesBelowFoldQuery.data.replies)
    }
  }, [repliesBelowFoldQuery.isSuccess, repliesBelowFoldQuery.data])

  const handlePopState = useCallback((event) => {

    if (isMobile) {
      // Prevent the default action
      event.preventDefault();
      // Call your close function
      onClose();

      window.history.pushState(null, '', window.location.href);
    }
  }, [onClose]);

  useEffect(() => {
    if (castHash && isMobile) {
      // Add event listener for popstate
      window.history.pushState(null, '', window.location.href);

      window.addEventListener('popstate', handlePopState);
    }

    // Cleanup function
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [castHash, handlePopState]);

  useEffect(() => {
    if (cast) {
      setTimeout(() => {
        if (ancestorCasts.length > 0 && mainContentRef.current) {
          mainContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (headerRef.current) {
          headerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [cast, ancestorCasts.length]);

  useEffect(() => {
    setShowRepliesBelowFold(false)
  }, [castHash])

  if (!castHash) {
    return null
  }

  const pullToRefreshContent = (
    <div className='flex flex-row items-center justify-center gap-x-2 pt-2 animate-pulse text-gray-500 text-sm'>
      <p>Pull to refresh</p>
    </div>
  )

  return (
    <div className={`fixed inset-0 z-[48] overflow-y-auto overscroll-none bg-black bg-opacity-50 flex justify-center items-start lg:hidden ${!castHash && 'hidden'}`}>
      <div className="relative bg-white dark:bg-gray-900 w-full min-h-screen shadow-xl overflow-y-auto">
        <div ref={headerRef} className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-2">
          <div className="flex justify-between items-center pt-2 px-1">
            <div className="w-11"></div> {/* Spacer for centering */}
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {castDefaultQuery.isLoading ? (
                <div className='h-6 w-32'></div>
              ) : castDefaultQuery.isSuccess && castDefaultQuery.data?.currentCast?.channel ? (
                <span className='flex flex-row items-center gap-x-2 truncate'>
                  <Avatar className='h-4 w-4'>
                    <AvatarImage src={castDefaultQuery.data.currentCast.channel.image_url} alt={castDefaultQuery.data.currentCast.channel.name} />
                    <AvatarFallback></AvatarFallback>
                  </Avatar>
                  {`${castDefaultQuery.data.currentCast.channel.name}`}
                </span>
              ) : 'Conversation'
              }
            </h2>
            <button
              onClick={onClose}
              // custom size to increase the hitbox
              className="rounded-md py-2 pl-2 pr-4 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="">
          {castDefaultQuery.isLoading ? (
            <CastDetailSkeleton />
          ) : (castDefaultQuery.isSuccess && castDefaultQuery.data && cast) ? (
            <PullToRefresh
              onRefresh={castDefaultQuery.refetch}
              pullingContent={pullToRefreshContent}
              refreshingContent={<Loader2 className='h-8 w-8 mx-auto animate-spin mt-2' />}
              isPullable={true}
            >
              <ul>
                {ancestorCasts.length > 0 &&
                  <ul>
                    {ancestorCasts.map((ancestorCast) => (
                      <li
                        key={ancestorCast.hash}
                        className='sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800'
                        onClick={(e) => navigateToCast(e, ancestorCast.hash)}
                      >
                        <AncestorCast cast={ancestorCast} />
                      </li>
                    ))}
                  </ul>
                }
                <div ref={mainContentRef} className='pt-2 px-4'>
                  {!deletedCastMap[cast.hash]
                    ?
                    <div className="flex flex-row">
                      <div className="mr-2 flex-shrink-0">
                        {!!cast.author.pfp_url
                          ?
                          <Link href={`/${cast.author.username}`}>
                            <ProfileHoverCard
                              fid={cast.author.fid}
                              avatar={cast.author.pfp_url}
                              username={cast.author.username}
                              displayName={cast.author.display_name}
                              bio={cast.author.profile.bio.text}
                              followingCount={cast.author.following_count}
                              followerCount={cast.author.follower_count}
                              powerBadge={cast.author.power_badge}
                            >
                              <div className="relative">
                                <Avatar className='h-12 w-12'>
                                  <AvatarImage
                                    src={cast.author.pfp_url}
                                    alt='Profile picture'
                                  />
                                  <AvatarFallback>
                                    <Skeleton
                                      className="h-12 w-12"
                                    />
                                  </AvatarFallback>
                                </Avatar>
                                <FollowButton
                                  authorFid={cast.author.fid}
                                  initialFollowingStatus={cast.author.viewer_context?.following || false}
                                  className="absolute -bottom-0.5 -right-0.5"
                                />
                              </div>
                            </ProfileHoverCard>
                          </Link>
                          :
                          <span className="inline-block h-10 w-10 overflow-hidden rounded-full bg-gray-100">
                            <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </span>
                        }
                      </div>
                      <div className="flex flex-col flex-grow min-w-0">
                        <div className="flex flex-row text-sm mb-1 items-center justify-between max-w-full min-w-0 overflow-hidden">
                          <div className='flex flex-row items-center min-w-0'>
                            <ProfileHoverCard
                              fid={cast.author.fid}
                              avatar={cast.author.pfp_url}
                              username={cast.author.username}
                              displayName={cast.author.display_name}
                              bio={cast.author.profile.bio.text}
                              followingCount={cast.author.following_count}
                              followerCount={cast.author.follower_count}
                              powerBadge={cast.author.power_badge}
                            >
                              <Link href={`/${cast.author.username}`} className='font-semibold mr-1 hover:underline dark:text-gray-100 flex flex-row gap-x-1 items-center min-w-0 max-w-full'>
                                <span className={`truncate`}>{cast.author.display_name}</span>
                                {cast.author.power_badge && <PowerBadge />}
                                {isSupercastMember(cast.author.fid) && <CastoraBadge />}
                              </Link>
                            </ProfileHoverCard>
                            <ProfileHoverCard
                              fid={cast.author.fid}
                              avatar={cast.author.pfp_url}
                              username={cast.author.username}
                              displayName={cast.author.display_name}
                              bio={cast.author.profile.bio.text}
                              followingCount={cast.author.following_count}
                              followerCount={cast.author.follower_count}
                              powerBadge={cast.author.power_badge}
                            >
                              <div className='min-w-0 max-w-full truncate'>
                                <Link href={`/${cast.author.username}`} className='text-gray-500 dark:text-gray-400 hover:underline truncate'>@{cast.author.username}</Link>
                              </div>
                            </ProfileHoverCard>
                            <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>·</span>
                            <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>{getTimeSinceTimestamp(cast.timestamp, isMobile)}</span>
                          </div>
                        </div>
                        <p
                          className="text-sm text-gray-900 dark:text-gray-100 mb-2 break-words max-w-full"
                        >
                          <CastText text={cast.text} />
                        </p>
                        {cast.embeds.length > 0 &&
                          <div className='mb-2'>
                            <CastEmbeds cast={cast} />
                          </div>
                        }
                        {!!parentURLToChannelName(cast.parent_url) &&
                          <div className='flex items-center border rounded-md text-xs max-w-fit px-1 py-0.5 mb-1 dark:border-gray-700'>
                            <Link
                              onClick={(e) => e.stopPropagation()}
                              href={`/channel/${parentURLToChannelId(cast.parent_url)}`}
                              className='text-gray-500 dark:text-gray-400 hover:underline'>{`/${parentURLToChannelName(cast.parent_url)}`}
                            </Link>
                          </div>
                        }
                        <ReactionBar
                          castHash={cast.hash}
                          authorFid={cast.author.fid}
                          replyCount={cast.replies.count}
                          reactionStatus={reactionStatus}
                          setReactionStatus={setReactionStatus}
                          reactionCount={reactionCount}
                          setReactionCount={setReactionCount}
                          recastStatus={recastStatus}
                          setRecastStatus={setRecastStatus}
                          recastCount={recastCount}
                          setRecastCount={setRecastCount}
                          bookmarkStatus={bookmarkStatus}
                          setBookmarkStatus={setBookmarkStatus}
                          bookmarkCount={bookmarkCount}
                          setBookmarkCount={setBookmarkCount}
                        />
                      </div>
                    </div>
                    :
                    <DeletedCast />
                  }
                </div>
                {!!supercastUserState.currentFid
                  && <ReplyTextArea parentHash={castHash} replies={replies} setReplies={setReplies} />
                }
                {threadChildren.length > 0 &&
                  <ul>
                    {threadChildren.map((child, index) => (
                      <li
                        key={child.hash}
                        className='sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800'
                        onClick={(e) => navigateToCast(e, child.hash)}
                      >
                        <ThreadChildCast cast={child} isLast={index === threadChildren.length - 1} />
                      </li>
                    ))}
                  </ul>
                }
                {replies.length > 0 &&
                  <ul>
                    {replies.map((replyPair) => (
                      <span>
                        <li
                          key={replyPair[0].hash}
                          className='border-t border-gray-200 dark:border-gray-800 sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800 hover:cursor-pointer'
                          onClick={(e) => navigateToCast(e, replyPair[0].hash)}
                        >
                          <ReplyPreview cast={replyPair[0]} isLast={replyPair.length === 1} />
                        </li>
                        {replyPair.length > 1 &&
                          <li
                            key={replyPair[1].hash}
                            className=' sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800 hover:cursor-pointer'
                            onClick={(e) => navigateToCast(e, replyPair[1].hash)}
                          >
                            <ReplyPreview cast={replyPair[1]} isLast={true} />
                          </li>
                        }
                      </span>
                    ))}
                  </ul>
                }

                {(!showRepliesBelowFold && repliesBelowFold.length > 0) && (
                  <div className="px-4 py-2">
                    <Button
                      onClick={() => setShowRepliesBelowFold(true)}
                      className="w-full text-gray-500 font-normal text-sm"
                      variant="link"
                    >
                      Show more replies
                    </Button>
                  </div>
                )}

                {showRepliesBelowFold && repliesBelowFoldQuery.isLoading && (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                )}

                {showRepliesBelowFold && repliesBelowFold.length > 0 && (
                  <ul>
                    {repliesBelowFold.map((replyPair) => (
                      <div
                        key={replyPair[0].hash + replyPair[1]?.hash}
                      >
                        <li
                          onClick={() => setHash(replyPair[0].hash)}
                          className='border-t border-gray-200 dark:border-gray-800 sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800 hover:cursor-pointer'
                        >
                          <ReplyPreview cast={replyPair[0]} isLast={replyPair.length === 1} isColumn={true} />
                        </li>
                        {replyPair.length > 1 &&
                          <li
                            key={replyPair[1].hash}
                            onClick={() => setHash(replyPair[1].hash)}
                            className='sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800 hover:cursor-pointer'
                          >
                            <ReplyPreview cast={replyPair[1]} isLast={true} isColumn={true} />
                          </li>
                        }
                      </div>
                    ))}
                  </ul>
                )}
              </ul>
            </PullToRefresh>
          ) : null}
        </div>
      </div>
    </div>
  )
}
