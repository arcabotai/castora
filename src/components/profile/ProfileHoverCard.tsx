"use client";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import { formatNumber } from "@/utils/textUtils";
import Link from "next/link";
import PowerBadge from "../PowerBadge";
import SupercastBadge from '../SupercastBadge';
import { useSupercastMember } from '@/providers/SupercastMemberProvider'
import { Skeleton } from "../ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface ProfileHoverCardProps {
  fid: number;
  avatar: string;
  username: string;
  displayName: string;
  bio: string;
  followingCount: number;
  followerCount: number;
  powerBadge?: boolean;
  children: React.ReactNode;
}

export default function ProfileHoverCard(props: ProfileHoverCardProps) {

  const { fid, avatar, username, displayName, bio, followingCount, followerCount, powerBadge, children } = props;
  const { isSupercastMember } = useSupercastMember();

  return (
    <HoverCard openDelay={50} closeDelay={0}>
      <HoverCardTrigger>
        {children}
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col p-4 cursor-auto dark:bg-gray-900 w-[360px] max-w-[360px] rounded-lg shadow-md text-sm"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
        >
          <div className="flex flex-row justify-between items-center mb-2 shrink-0">
            <Link href={`/${username}`}>
              <Avatar className='h-12 w-12 mr-4'>
                <AvatarImage
                  src={avatar}
                  alt='Profile picture'
                />
                <AvatarFallback>
                  <Skeleton
                    className="h-12 w-12"
                  />
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
          <div className="flex-grow flex flex-col gap-y-2">
            <div className='flex flex-row justify-between items-center'>
              <div className=''>
                <Link href={`/${username}`} className="flex flex-row gap-x-1 items-center">
                  <div className="font-bold dark:text-gray-100 hover:underline">{displayName ? displayName : "New user"}</div>
                  {powerBadge && <PowerBadge />}
                  {isSupercastMember(fid) && <SupercastBadge />}
                </Link>
                <div className='flex flex-col gap-y-1 items-start lg:flex-row lg:items-center'>
                  <span className='flex flex-row items-center'>
                    <Link href={`/${username}`}>
                      <div className="text-gray-400 mr-2 hover:underline">@{username}</div>
                    </Link>
                  </span>
                </div>
              </div>
            </div>
            <p className="text-md w-[280px] break-words">
              {/* <CastText text={bio} /> */}
              {bio}
            </p>
            <div className="flex flex-row text-sm items-center gap-x-2">
              <p><span className="font-semibold text-black dark:text-gray-100">{formatNumber(followingCount)}</span> Following</p>
              <p><span className="font-semibold text-black dark:text-gray-100">{formatNumber(followerCount)}</span> Followers</p>
              <p><span className="font-semibold text-black dark:text-gray-100">{fid}</span> FID</p>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}