import { UserCircleIcon, XMarkIcon } from "@heroicons/react/24/solid"
import axios from "axios"
import { useEffect, useRef } from 'react'
import { HOST_URL } from "@/utils/hostURL"
import { useRouter, usePathname } from 'next/navigation';
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth"
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider"
import { useInfiniteQuery } from 'react-query'
import { useInView } from 'react-intersection-observer';
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";
import PowerBadge from "../PowerBadge";
import SupercastBadge from "../SupercastBadge";
import { useSupercastMember } from "@/providers/SupercastMemberProvider";
import { formatNumber, truncateLongWord } from "@/utils/textUtils";
import ProfileFollowingSkeleton from "./ProfileFollowingSkeleton";

type ProfileFollowingProps = {
  setRightColumnStatus: Function
  fid: number
  type: "following" | "followers" | "relevant_follows"
}

export default function ProfileFollowing({ setRightColumnStatus, fid, type }: ProfileFollowingProps) {

  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken, ready: privyReady } = usePrivy()
  const { isSupercastMember } = useSupercastMember();

  const { ref: inViewRef, inView } = useInView();

  const fetchFollowing = async ({ pageParam = '' }) => {
    const accessToken = await getAccessToken()

    let response;

    if (type === "relevant_follows") {

      response = await axios.get(`${HOST_URL}/api/profile/relevant-followers?profileFid=${fid}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'asFid': supercastUserState.currentFid,
        }
      })

    } else {

      response = await axios.get(`${HOST_URL}/api/profile/following?followingFid=${fid}&cursor=${pageParam}&type=${type}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'asFid': supercastUserState.currentFid,
        }
      })

    }

    return response.data
  }

  const followingQuery = useInfiniteQuery(
    ['following', fid, type],
    fetchFollowing,
    {
      getNextPageParam: (lastPage) => lastPage.cursor,
      enabled: privyReady && !!fid,
    }
  )

  useEffect(() => {
    if (inView && !followingQuery.isFetchingNextPage && followingQuery.hasNextPage) {
      followingQuery.fetchNextPage()
    }
  }, [inView, followingQuery.isFetchingNextPage, followingQuery.hasNextPage]);

  const handleCloseColumn = () => {
    setRightColumnStatus('')
  }

  const renderSkeletons = () => (
    <>
      {[...Array(10)].map((_, index) => (
        <ProfileFollowingSkeleton key={index} />
      ))}
    </>
  );

  return (
    <div className="fixed top-0 flex flex-col max-h-screen overflow-y-auto min-h-screen max-w-[400px] w-full">
      <div className='flex flex-row justify-between items-center py-2 px-4'>
        <button
          onClick={() => handleCloseColumn()}
          type="button"
          className="rounded-md py-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 flex flex-row items-center"
        >
          <XMarkIcon className="h-4 w-4 mr-2" />
          {type === "following" ? "Following" : type === "relevant_follows" ? "Followers you follow" : "Followers"}
        </button>
      </div>
      <div>
        <ul className=''>
          {followingQuery.isLoading ? (
            renderSkeletons()
          ) : followingQuery.isSuccess && (
            followingQuery.data?.pages.map((page, pageIndex) => (
              page.users.map((user, profileIndex) => (
                <li
                  key={user.fid}
                >
                  <Link href={`/${user.username}`} className='border-t border-gray-200 dark:border-gray-800 lg:hover:bg-gray-50 dark:lg:hover:bg-gray-800 flex flex-row items-center px-4 py-3 group'>
                    {profileIndex === 12 && pageIndex === followingQuery.data.pages.length - 1 && (
                      <div ref={inViewRef} className="h-1"></div>
                    )}
                    <div className="flex flex-col text-sm">
                      <div className="flex flex-row items-center mb-2 shrink-0">
                        <Avatar className='h-10 w-10 mr-4'>
                          <AvatarImage
                            src={user.pfp_url}
                            alt='Profile picture'
                          />
                          <AvatarFallback>
                            <Skeleton
                              className="h-10 w-10"
                            />
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex flex-row justify-between items-center'>
                          <div className=''>
                            <div className="flex flex-row gap-x-1 items-center">
                              <div className="font-bold dark:text-gray-100 hover:underline">{user.display_name ? user.display_name : "New user"}</div>
                              {user.power_badge && <PowerBadge />}
                              {isSupercastMember(user.fid) && <SupercastBadge />}
                            </div>
                            <div className='flex flex-col gap-y-1 items-start lg:flex-row lg:items-center'>
                              <span className='flex flex-row items-center'>
                                <div className="text-gray-400 mr-2 hover:underline">@{user.username}</div>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-grow flex flex-col gap-y-2 pl-14">
                        <p className="text-md break-words text-gray-500">
                          {truncateLongWord(user.profile.bio.text, 40)}
                        </p>
                        <div className="flex flex-row text-sm items-center gap-x-2">
                          <p><span className="font-semibold text-black dark:text-gray-100">{formatNumber(user.following_count)}</span> Following</p>
                          <p><span className="font-semibold text-black dark:text-gray-100">{formatNumber(user.follower_count)}</span> Followers</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            ))
          )}
        </ul>
        {followingQuery.isFetchingNextPage && renderSkeletons()}
      </div>
    </div>
  )
}
