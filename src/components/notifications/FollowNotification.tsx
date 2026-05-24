import { UserCircleIcon, UserPlusIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { getTimeSinceTimestamp } from "@/utils/textUtils";
import { useMediaQuery } from '@/hooks/useMediaQuery' // Added import
import Image from "next/image";
import ProfileHoverCard from "../profile/ProfileHoverCard";
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";
import SupercastBadge from '../SupercastBadge';
import { useSupercastMember } from '@/providers/SupercastMemberProvider'
import PowerBadge from "../PowerBadge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";

export default function FollowNotification({ notification }: { notification: any }) {

  const isMobile = useMediaQuery('(max-width: 1024px)'); // Added hook

  const pfpLimit = isMobile ? 6 : 10;

  const { supercastUserState } = useSupercastUserState()
  const { isSupercastMember } = useSupercastMember();

  const username = supercastUserState.accounts.find((account) => account.fid === supercastUserState.currentFid).username

  return (
    <Link
      href={`/${username}/followers`}
      className="flex flex-row py-3"
    >
      <div className="h-8 w-8 flex items-center justify-center mr-4 shrink-0">
        <UserPlusIcon className="w-6 h-6 text-blue-400" />
      </div>
      <div className="flex-grow">
        <div className="flex flex-row gap-x-1 mb-1">
          {/* display a row of profile pictures from trigger fids */}
          {notification.follows.slice(0, pfpLimit).map((follow: any) => {
            return (follow.user && follow.user.profile) && (
              <Link
                onClick={(e) => e.stopPropagation()}
                href={`/${follow.user.username}`}
                key={notification.most_recent_timestamp + follow.user.fid}
                className="flex flex-row items-center"
              >
                <ProfileHoverCard
                  fid={follow.user.fid}
                  avatar={follow.user.pfp_url}
                  username={follow.user.username}
                  displayName={follow.user.display_name}
                  bio={follow.user.profile ? follow.user.profile.bio.text : ""}
                  followerCount={follow.user.follower_count}
                  followingCount={follow.user.following_count}
                  powerBadge={follow.user.power_badge}
                >
                  <Avatar className='h-8 w-8'>
                    <AvatarImage
                      src={follow.user.pfp_url}
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
          <span className="font-semibold">{notification.follows[0].user.display_name}</span>
          {notification.follows[0].user.power_badge && <span className=""> <PowerBadge /></span>}
          {isSupercastMember(notification.follows[0].user.fid) && <SupercastBadge />}
          {notification.follows.length > 1 && <span> and {notification.follows.length - 1} others</span>}
          <span> followed you</span>
        </div>
      </div>
      <div className="flex items-start flex-shrink-0">
        <div className="flex flex-row items-center gap-x-1">
          {!notification.seen && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
          <span className='text-gray-500 text-sm sm:text-xs'>{getTimeSinceTimestamp(notification.most_recent_timestamp, isMobile)}</span>
        </div>
      </div>
    </Link>
  )
}
