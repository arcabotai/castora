'use client'

import {
  XMarkIcon,
  ArrowUpOnSquareIcon,
} from '@heroicons/react/24/outline'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'

import ReplyTextArea from '@/components/ReplyTextArea'
import { useSelectedCast } from '@/providers/SelectedCastProvider'

import { truncateLongWord, getTimeSinceTimestamp, getProcessedCastContent, parentURLToChannelName, parentURLToChannelId } from '@/utils/textUtils'

import ReplyPreview from './ReplyPreview'
import AncestorCast from './casts/AncestorCast'
import { Cast } from '@/types'
import { HOST_URL } from '@/utils/hostURL'
import ReactionBar from './casts/ReactionBar'
import { useDeletedCast } from '@/providers/DeletedCastsProvider'
import DeletedCast from './casts/DeletedCast'
import ThreadChildCast from './casts/ThreadChild'
import CastText from './casts/CastText'
import ProfileHoverCard from './profile/ProfileHoverCard'
import PowerBadge from './PowerBadge'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import { useQuery } from 'react-query'
import Spinner from './Spinner'
import SupercastBadge from './SupercastBadge'
import { useSupercastMember } from '@/providers/SupercastMemberProvider'
import CastEmbeds from './casts/CastEmbeds'
import CastDetailSkeleton from './casts/CastDetailSkeleton'
import FollowButton from './profile/FollowButton'
import { AvatarFallback, AvatarImage } from './ui/avatar'
import { Avatar } from './ui/avatar'
import { Skeleton } from './ui/skeleton'
import { Button } from './ui/button'
import { ChevronRight } from 'lucide-react'
import { useSuperLogin } from '@/hooks/useSuperLogin'
import { useRouter } from 'next/navigation'

export default function CastDetailColumn() {

  const { hash: castHash, setHash } = useSelectedCast()

  const [replies, setReplies] = useState<Cast[][]>([])
  const [repliesBelowFold, setRepliesBelowFold] = useState<Cast[][]>([])

  const [reactionStatus, setReactionStatus] = useState(false)
  const [recastStatus, setRecastStatus] = useState(false)
  const [bookmarkStatus, setBookmarkStatus] = useState(false)
  const [reactionCount, setReactionCount] = useState(0)
  const [recastCount, setRecastCount] = useState(0)
  const [bookmarkCount, setBookmarkCount] = useState(0)

  const { supercastUserState, isAuthenticated, isGuest, isRegularUser } = useSupercastUserState()
  const { isSupercastMember } = useSupercastMember();
  const { ready, getAccessToken } = usePrivy()

  const router = useRouter()
  const { login } = useSuperLogin()

  const { deletedCastMap, setDeletedCastMap } = useDeletedCast()

  const [showRepliesBelowFold, setShowRepliesBelowFold] = useState(false)

  const fetchCast = async () => {
    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/cast?hash=${castHash}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })

    return response.data
  }

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

  const castQuery = useQuery(
    ['castDetailColumn', castHash],
    fetchCast,
    {
      enabled: !!castHash,
      refetchOnMount: false,
    }
  )

  const repliesBelowFoldQuery = useQuery(
    ['repliesBelowFold', castHash],
    fetchRepliesBelowFold,
    {
      enabled: !!castHash && (isRegularUser() || isGuest()),
      refetchOnMount: false,
    }
  )

  useEffect(() => {
    if (castQuery.isSuccess) {
      setReactionCount(castQuery.data.currentCast.reactions.likes_count)
      setRecastCount(castQuery.data.currentCast.reactions.recasts_count)
      setReactionStatus(!!supercastUserState.currentFid ? castQuery.data.currentCast.viewer_context.liked : false)
      setRecastStatus(!!supercastUserState.currentFid ? castQuery.data.currentCast.viewer_context.recasted : false)
      setReplies(castQuery.data.replies)
    }
    // run this any time castQuery fetched new data
  }, [castQuery.isSuccess, castQuery.data])

  useEffect(() => {
    if (repliesBelowFoldQuery.isSuccess) {
      setRepliesBelowFold(repliesBelowFoldQuery.data.replies)
    }
  }, [repliesBelowFoldQuery.isSuccess, repliesBelowFoldQuery.data])

  useEffect(() => {
    setShowRepliesBelowFold(false)
  }, [castHash])

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setHash('');
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [setHash]);

  if (!castHash) {
    return null
  }

  return (
    <div className='fixed top-0 flex flex-col max-h-screen overflow-y-auto min-h-screen max-w-[400px] w-full'>
      <div className='flex flex-row justify-between items-center py-2 px-4'>
        <button
          onClick={() => setHash('')}
          type="button"
          className="rounded-md py-1.5 text-sm font-medium text-black dark:text-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 flex flex-row items-center"
        >
          <XMarkIcon className="h-4 w-4 text-gray-900 dark:text-gray-100 mr-2" />
          Conversation
        </button>
      </div>
      {castQuery.isLoading ? (
        <CastDetailSkeleton />
      ) : castQuery.isSuccess && (
        <div>
          {castQuery.data.ancestorCasts.length > 0 &&
            <ul>
              {castQuery.data.ancestorCasts.map((ancestorCast) => (
                <li
                  onClick={() => setHash(ancestorCast.hash)}
                  key={ancestorCast.hash}
                  className='hover:bg-gray-50 dark:hover:bg-gray-800 hover:cursor-pointer'
                >
                  <AncestorCast cast={ancestorCast} />
                </li>
              ))}
            </ul>
          }
          <div className='pt-2 px-4'>
            {!deletedCastMap[castQuery.data.currentCast.hash]
              ?
              <div className="flex flex-row">
                <div className="mr-2 flex-shrink-0 relative">
                  {!!castQuery.data.currentCast.author.pfp_url
                    ?
                    <Link href={`/${castQuery.data.currentCast.author.username}`}>
                      <ProfileHoverCard
                        fid={castQuery.data.currentCast.author.fid}
                        avatar={castQuery.data.currentCast.author.pfp_url}
                        username={castQuery.data.currentCast.author.username}
                        displayName={castQuery.data.currentCast.author.display_name}
                        bio={castQuery.data.currentCast.author.profile.bio.text}
                        followingCount={castQuery.data.currentCast.author.following_count}
                        followerCount={castQuery.data.currentCast.author.follower_count}
                        powerBadge={castQuery.data.currentCast.author.power_badge}
                      >
                        <div className="relative">
                          <Avatar className='h-12 w-12'>
                            <AvatarImage
                              src={castQuery.data.currentCast.author.pfp_url}
                              alt='Profile picture'
                            />
                            <AvatarFallback>
                              <Skeleton
                                className="h-12 w-12"
                              />
                            </AvatarFallback>
                          </Avatar>
                          <FollowButton
                            authorFid={castQuery.data.currentCast.author.fid}
                            initialFollowingStatus={castQuery.data.currentCast.author.viewer_context?.following || false}
                            className="absolute -bottom-0.5 -right-0.5"
                          />
                        </div>
                      </ProfileHoverCard>
                    </Link>
                    :
                    <span className="inline-block h-12 w-12 overflow-hidden rounded-full bg-gray-100">
                      <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </span>
                  }
                </div>
                <div className="flex flex-col flex-grow min-w-0">
                  <div className='text-sm flex flex-row items-center mb-1 max-w-full min-w-0 overflow-hidden'>
                    <ProfileHoverCard
                      fid={castQuery.data.currentCast.author.fid}
                      avatar={castQuery.data.currentCast.author.pfp_url}
                      username={castQuery.data.currentCast.author.username}
                      displayName={castQuery.data.currentCast.author.display_name}
                      bio={castQuery.data.currentCast.author.profile.bio.text}
                      followingCount={castQuery.data.currentCast.author.following_count}
                      followerCount={castQuery.data.currentCast.author.follower_count}
                      powerBadge={castQuery.data.currentCast.author.power_badge}
                    >
                      <Link href={`/${castQuery.data.currentCast.author.username}`} className='font-semibold mr-1 hover:underline dark:text-gray-100 truncate flex flex-row gap-x-1 items-center min-w-0'>
                        <span className={`truncate`}>{castQuery.data.currentCast.author.display_name}</span>
                        {castQuery.data.currentCast.author.power_badge && <PowerBadge />}
                        {isSupercastMember(castQuery.data.currentCast.author.fid) && <SupercastBadge />}
                      </Link>
                    </ProfileHoverCard>
                    <ProfileHoverCard
                      fid={castQuery.data.currentCast.author.fid}
                      avatar={castQuery.data.currentCast.author.pfp_url}
                      username={castQuery.data.currentCast.author.username}
                      displayName={castQuery.data.currentCast.author.display_name}
                      bio={castQuery.data.currentCast.author.profile.bio.text}
                      followingCount={castQuery.data.currentCast.author.following_count}
                      followerCount={castQuery.data.currentCast.author.follower_count}
                      powerBadge={castQuery.data.currentCast.author.power_badge}
                    >
                      <Link href={`/${castQuery.data.currentCast.author.username}`} className='text-gray-500 dark:text-gray-400 hover:underline truncate'>@{castQuery.data.currentCast.author.username}</Link>
                    </ProfileHoverCard>
                    <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>·</span>
                    <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>{getTimeSinceTimestamp(castQuery.data.currentCast.timestamp, true)}</span>
                  </div>
                  <p className="text-[15px] text-gray-900 dark:text-gray-100 mb-2 break-words max-w-full">
                    <CastText text={castQuery.data.currentCast.text} />
                  </p>
                  {castQuery.data.currentCast.embeds.length > 0 &&
                    <div className='mb-2'>
                      <CastEmbeds cast={castQuery.data.currentCast} isColumn={true} />
                    </div>
                  }
                  {!!parentURLToChannelName(castQuery.data.currentCast.parent_url) &&
                    <div className='flex items-center border rounded-md text-xs max-w-fit px-1 py-0.5 mb-1 dark:border-gray-700'>
                      <Link
                        onClick={(e) => e.stopPropagation()}
                        href={`/channel/${parentURLToChannelId(castQuery.data.currentCast.parent_url)}`}
                        className='text-gray-500 dark:text-gray-400 hover:underline'>{`/${parentURLToChannelName(castQuery.data.currentCast.parent_url)}`}
                      </Link>
                    </div>
                  }
                  <ReactionBar
                    castHash={castQuery.data.currentCast.hash}
                    authorFid={castQuery.data.currentCast.author.fid}
                    replyCount={castQuery.data.currentCast.replies.count}
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
                    isCastDetail={true}
                  />
                </div>
              </div>
              :
              <DeletedCast />
            }
          </div>
          {!isAuthenticated() &&
            <div className='flex justify-center py-4 px-4 pl-[72px]'>
              <Button
                onClick={() => login()}
                className='w-full'>
                Login to reply
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </div>
          }
          {isGuest() &&
            <div className='flex justify-center py-4 px-4 pl-[72px]'>
              <Button
                onClick={() => router.push('/onboarding')}
                className='w-full'
              >
                Create profile to reply
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </div>
          }
          {isRegularUser() &&
            // if there is no threadchildren or replies, add some padding to the bottom
            <div className={`${(castQuery.data.threadChildren.length === 0 && replies.length === 0 && repliesBelowFold.length === 0) ? 'pb-32' : ''}`}>
              <ReplyTextArea parentHash={castHash} replies={replies} setReplies={setReplies} />
            </div>
          }
          {castQuery.data.threadChildren.length > 0 &&
            <ul>
              {castQuery.data.threadChildren.map((child, index) => (
                <li
                  onClick={() => setHash(child.hash)}
                  key={child.hash}
                  className='hover:bg-gray-50 dark:hover:bg-gray-800 hover:cursor-pointer'
                >
                  <ThreadChildCast cast={child} isLast={index === castQuery.data.threadChildren.length - 1} isColumn={true} />
                </li>
              ))}
            </ul>
          }
          {replies.length > 0 &&
            <ul>
              {replies.map((replyPair) => (
                <div
                  key={replyPair[0].hash + replyPair[1]?.hash}
                >
                  <li
                    onClick={() => setHash(replyPair[0].hash)}
                    className='border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:cursor-pointer'
                  >
                    <ReplyPreview cast={replyPair[0]} isLast={replyPair.length === 1} isColumn={true} />
                  </li>
                  {replyPair.length > 1 &&
                    <li
                      key={replyPair[1].hash}
                      onClick={() => setHash(replyPair[1].hash)}
                      className=' hover:bg-gray-50 dark:hover:bg-gray-800 hover:cursor-pointer'
                    >
                      <ReplyPreview cast={replyPair[1]} isLast={true} isColumn={true} />
                    </li>
                  }
                </div>
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
                    className='border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:cursor-pointer'
                  >
                    <ReplyPreview cast={replyPair[0]} isLast={replyPair.length === 1} isColumn={true} />
                  </li>
                  {replyPair.length > 1 &&
                    <li
                      key={replyPair[1].hash}
                      onClick={() => setHash(replyPair[1].hash)}
                      className=' hover:bg-gray-50 dark:hover:bg-gray-800 hover:cursor-pointer'
                    >
                      <ReplyPreview cast={replyPair[1]} isLast={true} isColumn={true} />
                    </li>
                  }
                </div>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
