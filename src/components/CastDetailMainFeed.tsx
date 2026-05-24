'use client'

import {
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'

import ReplyTextArea from '@/components/ReplyTextArea'
import Recast from './casts/Recast'
import URLPreviewCard from './casts/URLPreview'

import { getTimeSinceTimestamp, parentURLToChannelName, parentURLToChannelId } from '@/utils/textUtils'

import ReplyPreview from './ReplyPreview'
import { Cast } from '@/types'
import { HOST_URL } from '@/utils/hostURL'
import AncestorCast from './casts/AncestorCast'
import ReactionBar from './casts/ReactionBar'
import { isMobile } from 'react-device-detect'
import Image from 'next/image'
import CastOptions from './casts/CastOptions'
import { useDeletedCast } from '@/providers/DeletedCastsProvider'
import DeletedCast from './casts/DeletedCast'
import ThreadChildCast from './casts/ThreadChild'
import CastText from './casts/CastText'
import { useQuery } from 'react-query'
import ProfileHoverCard from './profile/ProfileHoverCard'
import PowerBadge from './PowerBadge'
import FarcasterFrame from './casts/FarcasterFrame'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import SupercastBadge from './SupercastBadge'
import { useSupercastMember } from '@/providers/SupercastMemberProvider'
import CastEmbeds from './casts/CastEmbeds'
import PullToRefresh from 'react-simple-pull-to-refresh';
import Spinner from './Spinner'
import FeedHeader from './FeedHeader'
import CastDetailSkeleton from './casts/CastDetailSkeleton'
import FollowButton from './profile/FollowButton'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Skeleton } from './ui/skeleton'
import { Button } from './ui/button'
import { Loader2 } from 'lucide-react'
import { useSuperLogin } from '@/hooks/useSuperLogin'
import { useRouter } from 'next/navigation'

export default function CastDetailMainFeed({ castHash }: { castHash: string }) {

  // if castHash is not cast root, find the earlier replies and display them

  const [cast, setCast] = useState<any>(null)
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

  const { supercastUserState, isAuthenticated, isGuest, isRegularUser } = useSupercastUserState()
  const { isSupercastMember } = useSupercastMember();
  const { ready, getAccessToken } = usePrivy()

  const { login } = useSuperLogin()
  const router = useRouter()

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
    });

    return response.data
  };

  const castDefaultQuery = useQuery(
    ['highlights', castHash, supercastUserState],
    fetchCast,
    {
      enabled: !!supercastUserState && ready,
    }
  );

  const repliesBelowFoldQuery = useQuery(
    ['repliesBelowFold', castHash],
    fetchRepliesBelowFold,
    {
      enabled: !!castHash && ready,
      refetchOnMount: false,
    }
  )

  useEffect(() => {
    if (castDefaultQuery.status === 'success' && castDefaultQuery.data) {
      const cast = castDefaultQuery.data.currentCast
      setAncestorCasts(castDefaultQuery.data.ancestorCasts)
      setCast(castDefaultQuery.data.currentCast)
      setReplies(castDefaultQuery.data.replies)
      setThreadChildren(castDefaultQuery.data.threadChildren)
      setReactionCount(cast.reactions.likes_count)
      setRecastCount(cast.reactions.recasts_count)
      setReactionStatus(!!supercastUserState.currentFid ? cast.viewer_context.liked : false)
      setRecastStatus(!!supercastUserState.currentFid ? cast.viewer_context.recasted : false)
    }
  }, [castDefaultQuery.status])

  useEffect(() => {
    if (repliesBelowFoldQuery.isSuccess) {
      setRepliesBelowFold(repliesBelowFoldQuery.data.replies)
    }
  }, [repliesBelowFoldQuery.isSuccess, repliesBelowFoldQuery.data])

  const pullToRefreshContent = (
    <div className='flex flex-row items-center justify-center gap-x-2 pt-2 animate-pulse text-gray-500 text-sm'>
      <p>Pull to refresh</p>
    </div>
  )

  return (
    <div className='flex flex-col sm:pt-4'>
      {castHash !== ''
        ? (castDefaultQuery.isLoading ? (
          <CastDetailSkeleton />
        ) : (castDefaultQuery.status === 'success' && !!cast) &&
        <div>
          <PullToRefresh
            onRefresh={castDefaultQuery.refetch}
            pullingContent={pullToRefreshContent}
            refreshingContent={<Loader2 className='h-8 w-8 mx-auto animate-spin mt-2' />}
            isPullable={isMobile}
          >
            <div>
              {ancestorCasts.length > 0 &&
                <ul>
                  {ancestorCasts.map((ancestorCast) => (
                    <li
                      key={ancestorCast.hash}
                      className='sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800'
                    >
                      <Link href={`/c/${ancestorCast.hash}`}>
                        <AncestorCast cast={ancestorCast} />
                      </Link>
                    </li>
                  ))}
                </ul>
              }
              <div className='pt-2 px-4'>
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
                    <div className="flex flex-col flex-grow">
                      <div className="flex flex-row text-sm mb-1 items-center justify-between max-w-[280px] xs:max-w-[310px] sm:max-w-none">
                        <div className='flex flex-row items-center'>
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
                            <Link href={`/${cast.author.username}`} className='font-semibold mr-1 hover:underline dark:text-gray-100 flex flex-row gap-x-1 items-center max-w-[130px] xs:max-w-[145px] sm:max-w-[280px]'>
                              <span className={`truncate`}>{cast.author.display_name}</span>
                              {cast.author.power_badge && <PowerBadge />}
                              {isSupercastMember(cast.author.fid) && <SupercastBadge />}
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
                            <div className='max-w-[90px] xs:max-w-[105px] sm:max-w-[200px] truncate'>
                              <Link href={`/${cast.author.username}`} className='text-gray-500 dark:text-gray-400 hover:underline truncate'>@{cast.author.username}</Link>
                            </div>
                          </ProfileHoverCard>
                          <span className='text-gray-500 dark:text-gray-400 ml-1'>·</span>
                          <span className='text-gray-500 dark:text-gray-400 ml-1'>{getTimeSinceTimestamp(cast.timestamp, isMobile)}</span>
                        </div>
                      </div>
                      <p
                        className="text-sm sm:text-[15px] text-gray-900 dark:text-gray-100 mb-2 break-words max-w-[280px] xs:max-w-[310px] xl:max-w-[500px]"
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
              {!isAuthenticated() &&
                <div className='flex flex-row justify-center py-4 pl-[72px] pr-4 sm:pr-6'>
                  <Button
                    onClick={login}
                    className='w-full'
                  >
                    Login to reply
                  </Button>
                </div>
              }
              {isGuest() &&
                <div className='flex flex-row justify-center py-4 pl-[72px] pr-4 sm:pr-6'>
                  <Button
                    onClick={() => router.push('/onboarding')}
                    className='w-full'
                  >
                    Create profile to reply
                  </Button>
                </div>
              }
              {isRegularUser() && <ReplyTextArea parentHash={castHash} replies={replies} setReplies={setReplies} />}
              {threadChildren.length > 0 &&
                <ul>
                  {threadChildren.map((child, index) => (
                    <li
                      key={child.hash}
                      className='sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800'
                    >
                      <Link href={`/c/${child.hash}`}>
                        <ThreadChildCast cast={child} isLast={index === threadChildren.length - 1} />
                      </Link>
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
                      >
                        <Link href={`/c/${replyPair[0].hash}`}>
                          <ReplyPreview cast={replyPair[0]} isLast={replyPair.length === 1} />
                        </Link>
                      </li>
                      {replyPair.length > 1 &&
                        <li
                          key={replyPair[1].hash}
                          className=' sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800 hover:cursor-pointer'
                        >
                          <Link href={`/c/${replyPair[1].hash}`}>
                            <ReplyPreview cast={replyPair[1]} isLast={true} />
                          </Link>
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
                        className='border-t border-gray-200 dark:border-gray-800 sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800 hover:cursor-pointer'
                      >
                        <Link href={`/c/${replyPair[0].hash}`}>
                          <ReplyPreview cast={replyPair[0]} isLast={replyPair.length === 1} />
                        </Link>
                      </li>
                      {replyPair.length > 1 &&
                        <li
                          key={replyPair[1].hash}
                          className='sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800 hover:cursor-pointer'
                        >
                          <Link href={`/c/${replyPair[1].hash}`}>
                            <ReplyPreview cast={replyPair[1]} isLast={true} />
                          </Link>
                        </li>
                      }
                    </div>
                  ))}
                </ul>
              )}
            </div>
          </PullToRefresh>
        </div>
        )
        :
        <div className='flex flex-row justify-center'>
          {/* <p className='text-sm text-gray-600 pt-2'>No cast selected</p> todo  placeholder */}
        </div>
      }
    </div>
  )
}
