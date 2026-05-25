'use client'

import { useState } from 'react'
import Link from 'next/link'
import FollowButton from '../profile/FollowButton'

import Recast from '@/components/casts/Recast'
import URLPreviewCard from '@/components/casts/URLPreview'
import { getTimeSinceTimestamp, parentURLToChannelName, parentURLToChannelId } from '@/utils/textUtils'
import ReactionBar from './ReactionBar'

import Image from 'next/image'
import { useDeletedCast } from '@/providers/DeletedCastsProvider'
import DeletedCast from './DeletedCast'
import CastText from './CastText'
import FarcasterFrame from './FarcasterFrame'
import ProfileHoverCard from '../profile/ProfileHoverCard'
import PowerBadge from '../PowerBadge'
import SupercastBadge from '../SupercastBadge'
import { useSupercastMember } from '@/providers/SupercastMemberProvider'
import CastEmbeds from './CastEmbeds'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Skeleton } from '../ui/skeleton'

export default function AncestorCast({ cast, isColumn = false }: { cast: any, isColumn?: boolean }) {

  const { supercastUserState } = useSupercastUserState()

  const [reactionStatus, setReactionStatus] = useState(!!supercastUserState.currentFid ? cast.viewer_context.liked : false)
  const [recastStatus, setRecastStatus] = useState(!!supercastUserState.currentFid ? cast.viewer_context.recasted : false)
  const [bookmarkStatus, setBookmarkStatus] = useState(false)
  const [reactionCount, setReactionCount] = useState(cast.reactions.likes_count)
  const [recastCount, setRecastCount] = useState(cast.reactions.recasts_count)
  const [bookmarkCount, setBookmarkCount] = useState(0)

  const { deletedCastMap, setDeletedCastMap } = useDeletedCast()
  const { isSupercastMember } = useSupercastMember();

  return (
    <>
      {!deletedCastMap[cast.hash]
        ?
        <div className="px-4 pt-2 flex flex-row">
          <div className="mr-2 flex-shrink-0 flex flex-col items-center">
            {!!cast.author.pfp_url
              ?
              <Link href={`/${cast.author.username}`}>
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
              </Link>
              :
              <span className="inline-block h-10 w-10 overflow-hidden rounded-full bg-gray-100">
                <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
            }
            <div className='flex-grow w-0.5 bg-gray-200 dark:bg-gray-800 mt-1 -mb-2'></div>
          </div>
          <div className="flex flex-col flex-grow min-w-0">
            <div className="flex flex-row text-sm mb-1 items-center justify-between max-w-full overflow-hidden">
              <div className="flex flex-row text-sm min-w-0">
                <ProfileHoverCard
                  fid={cast.author.fid}
                  avatar={cast.author.pfp_url}
                  username={cast.author.username}
                  displayName={cast.author.display_name}
                  bio={cast.author.profile.bio.text}
                  followingCount={cast.author.followingCount}
                  followerCount={cast.author.follower_count}
                  powerBadge={cast.author.power_badge}
                >
                  <Link href={`/${cast.author.username}`} className='font-semibold mr-1 hover:underline dark:text-gray-100 flex flex-row gap-x-1 items-center min-w-0 max-w-[130px] xs:max-w-[145px] sm:max-w-[280px]'>
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
                  followingCount={cast.author.followingCount}
                  followerCount={cast.author.follower_count}
                  powerBadge={cast.author.power_badge}
                >
                  <div className='min-w-0 max-w-[90px] xs:max-w-[105px] sm:max-w-[200px] truncate'>
                    <Link href={`/${cast.author.username}`} className='text-gray-500 dark:text-gray-400 hover:underline truncate'>@{cast.author.username}</Link>
                  </div>
                </ProfileHoverCard>
                <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>·</span>
                <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>{getTimeSinceTimestamp(cast.timestamp, true)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-900 dark:text-gray-100 mb-2 break-words max-w-full">
              <CastText text={cast.text} />
            </p>
            {cast.embeds.length > 0 &&
              <div className='mb-2'>
                <CastEmbeds cast={cast} isColumn={isColumn} />
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
        : <DeletedCast />
      }
    </>
  )
}
