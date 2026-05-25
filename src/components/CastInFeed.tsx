'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

import { truncateLongWord, getTimeSinceTimestamp, getProcessedCastContent, parentURLToChannelName, parentURLToChannelId } from '@/utils/textUtils'
import ReactionBar from './casts/ReactionBar'
import FollowButton from './profile/FollowButton'

import { isMobile } from 'react-device-detect'
import Image from 'next/image'
import { useDeletedCast } from '@/providers/DeletedCastsProvider'
import DeletedCast from './casts/DeletedCast'
import CastText from './casts/CastText'
import ProfileHoverCard from "./profile/ProfileHoverCard";
import PowerBadge from './PowerBadge'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import CastoraBadge from './CastoraBadge'
import { useSupercastMember } from '@/providers/SupercastMemberProvider'
import CastEmbeds from './casts/CastEmbeds'
import { useSelectedCast } from '@/providers/SelectedCastProvider'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { Skeleton } from './ui/skeleton'
import { ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline'

export default function CastInFeed({ cast, isSelected = false }) {

  const { isSupercastMember } = useSupercastMember();
  const { deletedCastMap, setDeletedCastMap } = useDeletedCast()

  const { navigateToCast } = useSelectedCast()

  const [reactionStatus, setReactionStatus] = useState(!!cast.viewer_context ? cast.viewer_context.liked : false)
  const [recastStatus, setRecastStatus] = useState(!!cast.viewer_context ? cast.viewer_context.recasted : false)
  const [bookmarkStatus, setBookmarkStatus] = useState(false)
  const [reactionCount, setReactionCount] = useState(cast.reactions.likes_count)
  const [recastCount, setRecastCount] = useState(cast.reactions.recasts_count)

  return (
    <>
      {!deletedCastMap[cast.hash]
        ?
        <div className="flex flex-col w-full pt-3">
          {cast.isAuthorInList === false && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-8 flex items-center gap-x-2">
              <ArrowPathRoundedSquareIcon className='w-4 h-4' />
              Recasted by a member of the list
            </div>
          )}
          <div
            className="flex flex-row w-full"
            onClick={(e) => navigateToCast(e, cast.hash)}
          >
            <div className="mr-2 flex-shrink-0 relative">
              <Link
                onClick={(e) => e.stopPropagation()}
                href={`/${cast.author.username}`}
              >
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
                        <Skeleton className="h-12 w-12" />
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
            </div>
            <div className="flex flex-col flex-grow min-w-0">
              <div className="flex flex-row text-sm mb-1 items-center min-w-0 overflow-hidden">
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
                  <Link onClick={(e) => e.stopPropagation()} href={`/${cast.author.username}`} className='font-semibold mr-1 hover:underline dark:text-gray-100 flex flex-row gap-x-1 items-center min-w-0 max-w-full'>
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
                    <Link onClick={(e) => e.stopPropagation()} href={`/${cast.author.username}`} className='text-gray-500 dark:text-gray-400 hover:underline truncate'>@{cast.author.username}</Link>
                  </div>
                </ProfileHoverCard>
                <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>·</span>
                <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>{getTimeSinceTimestamp(cast.timestamp, isMobile)}</span>
              </div>
              <p className="text-sm sm:text-[15px] text-black mb-2 break-words dark:text-white max-w-full">
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
                bookmarkCount={0}
                setBookmarkCount={() => { }}
                isSelected={isSelected}
                isCastDetail={false}
              />
            </div>
          </div>
        </div>
        : <DeletedCast />
      }
    </>
  )
}
