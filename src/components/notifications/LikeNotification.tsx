import { UserCircleIcon, HeartIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { getTimeSinceTimestamp } from "@/utils/textUtils";
import { useMediaQuery } from '@/hooks/useMediaQuery'

import { useSelectedCast } from "@/providers/SelectedCastProvider";
import Image from "next/image";
import ProfileHoverCard from "../profile/ProfileHoverCard";
import PowerBadge from "../PowerBadge";
import SupercastBadge from '../SupercastBadge';
import { useSupercastMember } from '@/providers/SupercastMemberProvider'
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";

export default function LikeNotification({ notification }: { notification: any }) {

  const { navigateToCast } = useSelectedCast();
  const { isSupercastMember } = useSupercastMember();
  const isMobile = useMediaQuery('(max-width: 1024px)');

  const pfpLimit = isMobile ? 6 : 10;

  return (
    <div
      className="flex flex-row py-3"
      onClick={(e) => navigateToCast(e, notification.cast.hash)}
    >
      <div className="h-8 w-8 flex justify-center items-center mr-4 shrink-0">
        <HeartIcon className="w-6 h-6 text-red-500" />
      </div>
      <div className="flex-grow">
        <div className="flex flex-row gap-x-1 mb-1">
          {/* display a row of profile pictures from trigger fids */}
          {notification.reactions.slice(0, pfpLimit).map((reaction: any) => {
            return (reaction.user && reaction.user.profile) && (
              <Link
                onClick={(e) => e.stopPropagation()}
                href={`/${reaction.user.username}`}
                key={reaction.user.fid}
                className="flex flex-row items-center"
              >
                <ProfileHoverCard
                  fid={reaction.user.fid}
                  avatar={reaction.user.pfp_url}
                  username={reaction.user.username}
                  displayName={reaction.user.display_name}
                  bio={reaction.user.profile.bio.text}
                  followerCount={reaction.user.follower_count}
                  followingCount={reaction.user.following_count}
                  powerBadge={reaction.user.power_badge}
                >
                  <Avatar className='h-8 w-8'>
                    <AvatarImage
                      src={reaction.user.pfp_url}
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
            )
          })}
        </div>
        <div className="text-sm dark:text-gray-100 flex flex-row flex-wrap items-center gap-x-1">
          <span className="font-semibold">{notification.reactions[0].user.display_name}</span>
          {notification.reactions[0].user.power_badge && <span className=""> <PowerBadge /></span>}
          {isSupercastMember(notification.reactions[0].user.fid) && <SupercastBadge />}
          {notification.reactions.length > 1 && <span> and {notification.reactions.length - 1} others</span>}
          <span> liked your cast</span>
        </div>
        <div className="max-w-[280px] sm:max-w-sm">
          {/* display the content of the cast in gray color and small font */}
          {notification.cast && <span className="text-gray-500 text-sm">{notification.cast.text}</span>}
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
