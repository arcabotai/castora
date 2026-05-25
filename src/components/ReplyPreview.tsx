'use client'
import { useState } from 'react'
import Link from 'next/link'
import FollowButton from './profile/FollowButton'

import { Cast } from '@/types/index'
import ImageModal from './ImageModal'
import Recast from './casts/Recast'
import URLPreviewCard from './casts/URLPreview'
import { truncateLongWord, getTimeSinceTimestamp, getProcessedCastContent } from '@/utils/textUtils'
import ReactionBar from './casts/ReactionBar'
import Image from 'next/image'
import { useDeletedCast } from '@/providers/DeletedCastsProvider'
import DeletedCast from './casts/DeletedCast'
import CastText from './casts/CastText'
import ProfileHoverCard from './profile/ProfileHoverCard'
import PowerBadge from './PowerBadge'
import FarcasterFrame from './casts/FarcasterFrame'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import SupercastBadge from './SupercastBadge'
import { useSupercastMember } from '@/providers/SupercastMemberProvider'
import CastEmbeds from './casts/CastEmbeds'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Skeleton } from './ui/skeleton'

export default function ReplyPreview({ cast, isLast, isColumn = false }: { cast: any, isLast: boolean, isColumn?: boolean }) {

  const { isSupercastMember } = useSupercastMember();
  const { deletedCastMap, setDeletedCastMap } = useDeletedCast()
  const { supercastUserState } = useSupercastUserState()

  const [reactionStatus, setReactionStatus] = useState(!!cast.viewer_context ? !!supercastUserState.currentFid ? cast.viewer_context.liked : false : false)
  const [recastStatus, setRecastStatus] = useState(!!cast.viewer_context ? !!supercastUserState.currentFid ? cast.viewer_context.recasted : false : false)
  const [bookmarkStatus, setBookmarkStatus] = useState(false)
  const [reactionCount, setReactionCount] = useState(!!cast.reactions ? cast.reactions.likes_count : 0)
  const [recastCount, setRecastCount] = useState(!!cast.reactions ? cast.reactions.recasts_count : 0)
  const [bookmarkCount, setBookmarkCount] = useState(0)

  return (
    <>
      {!deletedCastMap[cast.hash]
        ?
        <div className="px-4 pt-2 flex flex-row">
          <div className="mr-2 flex-shrink-0 flex flex-col items-center">
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
            {!isLast &&
              <div className='flex-grow w-0.5 bg-gray-200 dark:bg-gray-800 mt-1 -mb-2'></div>
            }
          </div>
          {/* this is hard coded to work in the mainfeed, but can grow out of the column view */}
          {/* also fails on mobile */}
          <div className="flex flex-col flex-grow min-w-0">
            <div className="flex flex-row text-sm mb-1 items-center justify-between max-w-full overflow-hidden">
              <div className="flex flex-row text-sm mb-1 min-w-0">
                <Link href={`/${cast.author.username}`} className='font-semibold mr-1 hover:underline dark:text-gray-100 flex flex-row gap-x-1 items-center min-w-0 max-w-[130px] xs:max-w-[145px] sm:max-w-[280px]'>
                  <span className={`truncate`}>{cast.author.display_name}</span>
                  {cast.author.power_badge && <PowerBadge />}
                  {isSupercastMember(cast.author.fid) && <SupercastBadge />}
                </Link>
                <div className='min-w-0 max-w-[90px] xs:max-w-[105px] sm:max-w-[200px] truncate'>
                  <Link href={`/${cast.author.username}`} className='text-gray-500 dark:text-gray-400 hover:underline truncate'>@{cast.author.username}</Link>
                </div>
                <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>·</span>
                <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>{getTimeSinceTimestamp(!!cast.timestamp ? cast.timestamp : Date.now(), true)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-900 dark:text-gray-100 mb-2 break-words max-w-full">
              <CastText text={cast.text} />
            </p>
            {(!!cast.embeds && cast.embeds.length > 0) &&
              <div className='mb-2'>
                <CastEmbeds cast={cast} isColumn={isColumn} />
              </div>
            }
            <ReactionBar
              castHash={cast.hash}
              authorFid={cast.author.fid}
              replyCount={!!cast.replies ? cast.replies.count : 0}
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
        <div className='pl-4 py-2'>
          <DeletedCast />
        </div>
      }
    </>
  )
}
