import { useState } from "react";
import { getTimeSinceTimestamp } from "@/utils/textUtils";
import Link from "next/link";
import { useMediaQuery } from '@/hooks/useMediaQuery' // Added import
import { useSelectedCast } from "@/providers/SelectedCastProvider";
import Image from "next/image";
import ReactionBar from "../casts/ReactionBar";
import CastText from "../casts/CastText";
import ProfileHoverCard from "../profile/ProfileHoverCard";
import URLPreviewCard from "../casts/URLPreview";
import Recast from "../casts/Recast";
import PowerBadge from "../PowerBadge";
import FarcasterFrame from "../casts/FarcasterFrame";
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";
import CastoraBadge from '../CastoraBadge';
import { useSupercastMember } from '@/providers/SupercastMemberProvider'
import CastEmbeds from "../casts/CastEmbeds";
import ParentCastPreview from "../casts/ParentCastPreview";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";

export default function MentionNotification({ notification, isSelected = false }: { notification: any, isSelected?: boolean }) {

  const { navigateToCast } = useSelectedCast();
  const { supercastUserState } = useSupercastUserState()
  const { isSupercastMember } = useSupercastMember();
  const isMobile = useMediaQuery('(max-width: 1024px)'); // Added hook

  if (!notification.cast) return null

  const [recastStatus, setRecastStatus] = useState(notification.cast.reactions.recasts.map((recast: any) => recast.fid).includes(supercastUserState.currentFid))
  const [recastCount, setRecastCount] = useState(notification.cast.reactions.recasts_count)
  const [reactionStatus, setReactionStatus] = useState(notification.cast.reactions.likes.map((like: any) => like.fid).includes(supercastUserState.currentFid))
  const [reactionCount, setReactionCount] = useState(notification.cast.reactions.likes_count)
  const [bookmarkStatus, setBookmarkStatus] = useState(false)
  const [bookmarkCount, setBookmarkCount] = useState(0)

  return (
    <div
      className="flex flex-row pt-3"
      onClick={(e) => navigateToCast(e, notification.cast.hash)}
    >
      <div className="h-8 w-8 flex items-center mr-4 shrink-0">
        <Link href={`/${notification.cast.author.username}`}>
          <ProfileHoverCard
            fid={notification.cast.author.fid}
            avatar={notification.cast.author.pfp_url}
            username={notification.cast.author.username}
            displayName={notification.cast.author.display_name}
            bio={notification.cast.author.profile.bio.text}
            followingCount={notification.cast.author.following_count}
            followerCount={notification.cast.author.follower_count}
            powerBadge={notification.cast.author.power_badge}
          >
            <Avatar className='h-8 w-8'>
              <AvatarImage
                src={notification.cast.author.pfp_url}
                alt='Profile picture'
              />
              <AvatarFallback>
                <Skeleton
                  className="h-8 w-8"
                />
              </AvatarFallback>
            </Avatar>
          </ProfileHoverCard>
        </Link>
      </div>
      <div className="flex-grow">
        <div className="flex flex-row text-sm mb-1">
          <ProfileHoverCard
            fid={notification.cast.author.fid}
            avatar={notification.cast.author.pfp_url}
            username={notification.cast.author.username}
            displayName={notification.cast.author.display_name}
            bio={notification.cast.author.profile.bio.text}
            followingCount={notification.cast.author.following_count}
            followerCount={notification.cast.author.follower_count}
            powerBadge={notification.cast.author.power_badge}
          >
            <Link href={`/${notification.cast.author.username}`} className='font-semibold mr-1 dark:text-gray-100 hover:underline flex flex-row gap-x-1 items-center'>
              <span className={`truncate`}>{notification.cast.author.display_name}</span>
              {notification.cast.author.power_badge && <PowerBadge />}
              {isSupercastMember(notification.cast.author.fid) && <CastoraBadge />}
            </Link>
          </ProfileHoverCard>
          <ProfileHoverCard
            fid={notification.cast.author.fid}
            avatar={notification.cast.author.pfp_url}
            username={notification.cast.author.username}
            displayName={notification.cast.author.display_name}
            bio={notification.cast.author.profile.bio.text}
            followingCount={notification.cast.author.following_count}
            followerCount={notification.cast.author.follower_count}
            powerBadge={notification.cast.author.power_badge}
          >
            <Link href={`/${notification.cast.author.username}`} className='text-gray-500 hover:underline'>@{notification.cast.author.username}</Link>
          </ProfileHoverCard>
        </div>
        {notification.cast.parent_hash && (
          <div className="mt-1">
            <ParentCastPreview hash={notification.cast.parent_hash} />
          </div>
        )}
        <div className="max-w-full mb-2">
          {/* display the content of the cast in gray color and small font */}
          <div className="text-gray-900 dark:text-gray-100 text-sm mb-2">
            <CastText text={notification.cast.text} />
          </div>
          {notification.cast.embeds.length > 0 &&
            <div className='mb-2'>
              <CastEmbeds cast={notification.cast} />
            </div>
          }
        </div>
        <div className="w-full overflow-visible">
          <ReactionBar
            castHash={notification.cast.hash}
            authorFid={notification.cast.author.fid}
            replyCount={notification.cast.replies.count}
            reactionCount={reactionCount}
            recastCount={recastCount}
            bookmarkCount={bookmarkCount}
            reactionStatus={reactionStatus}
            recastStatus={recastStatus}
            bookmarkStatus={bookmarkStatus}
            setRecastCount={setRecastCount}
            setRecastStatus={setRecastStatus}
            setReactionCount={setReactionCount}
            setReactionStatus={setReactionStatus}
            setBookmarkCount={setBookmarkCount}
            setBookmarkStatus={setBookmarkStatus}
            isSelected={isSelected}
            isCastDetail={false}
          />
        </div>
      </div>
      <div className="flex items-start flex-shrink-0">
        <div className="flex flex-row items-center gap-x-1">
          {!notification.seen && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
          <span className='text-gray-500 text-sm sm:text-xs'>{getTimeSinceTimestamp(notification.most_recent_timestamp, isMobile)}</span>
        </div>
      </div>
    </div>
  )
}
