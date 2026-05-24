import React from 'react';
import CastInFeed from './CastInFeed'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { ArrowPathRoundedSquareIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon, CheckCircleIcon, UserCircleIcon, UserPlusIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useSelectedCast } from '@/providers/SelectedCastProvider'
import { useImageInFocus } from '@/providers/ImageInFocusProvider';

import { isMobile } from 'react-device-detect';
import { HOST_URL } from '@/utils/hostURL';
import { formatNumber, getProcessedCastContent } from '@/utils/textUtils';
import { toast } from 'sonner';
import Image from 'next/image';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import CastText from './casts/CastText';

import { useQuery, useInfiniteQuery } from 'react-query';
import Spinner from './Spinner';
import EditProfileButton from './profile/EditProfileButton';
import PowerBadge from './PowerBadge';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import { usePrivy } from '@privy-io/react-auth';
import { useOpenSignerApproval } from '@/providers/OpenSignerApprovalProvider'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import SupercastBadge from './SupercastBadge'
import { useSupercastMember } from '@/providers/SupercastMemberProvider'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from './ui/drawer';
import { Button } from './ui/button';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from './ui/skeleton';
import CastInFeedSkeleton from './casts/CastInFeedSkeleton'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import ProfileFollowing from './profile/ProfileFollowing'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { SUPERANON_ADMIN_FIDS } from '@/utils/anon/admin';
import { useSuperLogin } from '@/hooks/useSuperLogin';

export default function Profile({ profile, setRightColumnStatus }) {

  const { setHash } = useSelectedCast()
  const [topRelevantFollowers, setTopRelevantFollowers] = useState([])
  const [relevantFollowerCount, setRelevantFollowerCount] = useState(0)
  const { setOpen: setOpenImageInFocus, setImage: setImageInFocus } = useImageInFocus()
  const { supercastUserState, isAuthenticated, isGuest } = useSupercastUserState()
  const { isSupercastMember } = useSupercastMember();
  const { ready, getAccessToken } = usePrivy()
  const { setOpenSignerApproval } = useOpenSignerApproval()
  const { ref: inViewRef, inView } = useInView();

  const { login } = useSuperLogin()
  const router = useRouter()

  const isSuperanonNonAdmin = supercastUserState.currentFid === Number(process.env.NEXT_PUBLIC_SUPERANON_FID) && !SUPERANON_ADMIN_FIDS.includes(supercastUserState.userFid)

  const [followingStatus, setFollowingStatus] = useState(profile?.viewer_context?.following)
  const [followedByStatus, setFollowedByStatus] = useState(profile?.viewer_context?.followed_by)
  const [isLoadingFollow, setIsLoadingFollow] = useState(false)
  const [isLoadingUnfollow, setIsLoadingUnfollow] = useState(false)

  const [feedMode, setFeedMode] = useState<'casts' | 'replies' | 'highlights' | 'likes'>('casts')

  const [showFollowing, setShowFollowing] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showRelevantFollowers, setShowRelevantFollowers] = useState(false)

  const fetchCasts = async ({ pageParam = '' }) => {

    // open endpoint, no auth
    const response = await axios.get(`${HOST_URL}/api/user/casts?cursor=${pageParam}&profileFid=${profile.fid}&ownerFid=${supercastUserState.currentFid}`);

    return response.data;
  };

  const fetchReplies = async ({ pageParam = '' }) => {

    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/user/replies?cursor=${pageParam}&profileFid=${profile.fid}&ownerFid=${supercastUserState.currentFid}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    });

    return response.data;
  };

  const fetchHighlights = async () => {

    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/user/highlights?profileFid=${profile.fid}&ownerFid=${supercastUserState.currentFid}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }

    });

    return response.data;
  };

  const fetchLikes = async ({ pageParam = '' }) => {
    const response = await axios.get(`${HOST_URL}/api/user/likes?cursor=${pageParam}&profileFid=${profile.fid}&ownerFid=${supercastUserState.currentFid}`);
    return response.data;
  };

  const castsQuery = useInfiniteQuery(
    ['ProfileCasts', profile?.fid, supercastUserState],
    fetchCasts,
    {
      getNextPageParam: (lastPage) => lastPage.cursor || undefined,
      enabled: (!!profile && !!profile.fid && feedMode === "casts")
    }
  );

  const repliesQuery = useInfiniteQuery(
    ['profileReplies', profile?.fid, supercastUserState],
    fetchReplies,
    {
      getNextPageParam: (lastPage) => lastPage.cursor || undefined,
      enabled: (!!profile && !!profile.fid && feedMode === "replies") && isAuthenticated()
    }
  );

  const highlightsQuery = useQuery(
    ['profileHighlights', profile?.fid, supercastUserState],
    fetchHighlights,
    {
      enabled: (!!profile && !!profile.fid && feedMode === "highlights") && isAuthenticated()
    }
  );

  const likesQuery = useInfiniteQuery(
    ['profileLikes', profile?.fid, supercastUserState],
    fetchLikes,
    {
      getNextPageParam: (lastPage) => lastPage.cursor || undefined,
      enabled: (!!profile && !!profile.fid && feedMode === "likes") && isAuthenticated()
    }
  );

  const handleFollow = async () => {

    if (!isAuthenticated()) {
      login()
      return
    } else if (isGuest()) {
      router.push('/onboarding')
      return
    }

    setIsLoadingFollow(true)
    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/profile/follow`, {
      followedFid: profile.fid,
    },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'asFid': supercastUserState.currentFid,
        }
      })
      .then((response) => {
        setFollowingStatus(true)
      })
      .catch((error) => {
        if (error.response.data.error === "NO_SIGNER_APPROVED") {
          setOpenSignerApproval(true)
        } else {
          toast.error('Error following the user')
        }
      })
      .finally(() => {
        setIsLoadingFollow(false)
      })
  }

  const handleUnfollow = async () => {

    setIsLoadingUnfollow(true)
    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/profile/unfollow`, {
      unfollowedFid: profile.fid
    },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'asFid': supercastUserState.currentFid,
        }
      }
    )
      .then((response) => {
        setFollowingStatus(false)
      })
      .catch((error) => {
        if (error.response.data.error === "NO_SIGNER_APPROVED") {
          setOpenSignerApproval(true)
        } else {
          toast.error('Error unfollowing the user')
        }
      })
      .finally(() => {
        setIsLoadingUnfollow(false)
      })
  }

  const handleOpenProfileImage = () => {
    setOpenImageInFocus(true)
    setImageInFocus(profile.pfp_url)
  }

  const fetchRelevantFollowers = async () => {
    const accessToken = await getAccessToken()

    if (!!profile && !!profile.fid && !!supercastUserState.currentFid) {
      axios.get(`${HOST_URL}/api/profile/relevant-followers?profileFid=${profile.fid}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'asFid': supercastUserState.currentFid,
        }
      })
        .then((response) => {
          if (!!response.data.users) {
            console.log(response.data.users)
            setTopRelevantFollowers(response.data.users.slice(0, 3))
          }
          setRelevantFollowerCount(response.data.users.length)
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }

  useEffect(() => {
    fetchRelevantFollowers()
  }, [supercastUserState, profile])

  useEffect(() => {
    if (inView && feedMode === "casts" && castsQuery.hasNextPage && !castsQuery.isFetchingNextPage) {
      castsQuery.fetchNextPage();
    }
    if (inView && feedMode === "replies" && repliesQuery.hasNextPage && !repliesQuery.isFetchingNextPage) {
      repliesQuery.fetchNextPage();
    }
    if (inView && feedMode === "likes" && likesQuery.hasNextPage && !likesQuery.isFetchingNextPage) {
      likesQuery.fetchNextPage();
    }
  }, [
    inView,
    castsQuery.isFetchingNextPage,
    castsQuery.hasNextPage,
    repliesQuery.isFetchingNextPage,
    repliesQuery.hasNextPage,
    likesQuery.isFetchingNextPage,
    likesQuery.hasNextPage,
  ]);

  useEffect(() => {
    // every time the profile changes, reset the hash
    setHash('')

    if (!!profile) {
      setFollowingStatus(profile?.viewer_context?.following)
      setFollowedByStatus(profile?.viewer_context?.followed_by)
    }
  }, [profile])

  const renderSkeletons = () => (
    <ul>
      {[...Array(10)].map((_, index) => (
        <li key={index} className='px-4 sm:px-6 lg:px-8 border-b dark:border-gray-800'>
          <CastInFeedSkeleton />
        </li>
      ))}
    </ul>
  );

  return (
    <div className=''>
      <div className="px-4 sm:px-6 lg:px-8 flex flex-col pb-4 dark:border-gray-800">
        <div className='flex flex-col mt-4'>
          <div className="flex flex-row">
            <Avatar className='h-12 w-12 mr-4'>
              <AvatarImage
                src={profile?.pfp_url}
                alt='Profile picture'
                className='hover:cursor-pointer'
                onClick={() => handleOpenProfileImage()}
              />
              <AvatarFallback>
                <Skeleton
                  className="h-12 w-12"
                />
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <div className='flex flex-row justify-between items-center'>
                <div className='mb-1'>
                  <div className='flex flex-row items-center gap-x-1'>
                    {!!profile ?
                      <div className={`font-bold dark:text-gray-100 text-lg tracking-tight leading-snug truncate max-w-[220px] sm:max-w-none`}>{profile.display_name ? profile.display_name : "New user"}</div>
                      :
                      <Skeleton className="w-24 h-5 mb-1" />
                    }
                    {(!!profile && profile.power_badge && isMobile) &&
                      <Drawer>
                        <DrawerTrigger className='focus:outline-none'>
                          <PowerBadge />
                        </DrawerTrigger>
                        <DrawerContent className='focus:outline-none'>
                          <DrawerHeader>
                            <DrawerTitle>Farcaster power user</DrawerTitle>
                            <DrawerDescription>@{profile.username} is very active and respected by other Farcaster users.</DrawerDescription>
                          </DrawerHeader>
                          <DrawerFooter>
                            <DrawerClose>
                              <Button variant='secondary' className='w-full'>Close</Button>
                            </DrawerClose>
                          </DrawerFooter>
                        </DrawerContent>
                      </Drawer>
                    }
                    {(!!profile && profile.power_badge && !isMobile) &&
                      <HoverCard openDelay={50} closeDelay={100}>
                        <HoverCardTrigger className='hover:cursor-pointer'>
                          <PowerBadge />
                        </HoverCardTrigger>
                        <HoverCardContent side="bottom" align='center'>
                          <div className='w-80 px-4 py-2'>
                            <h3 className='font-semibold tracking-tight text-lg'>Farcaster power user</h3>
                            <p className='text-sm text-gray-500'>@{profile.username} is very active and respected by other Farcaster users.</p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    }
                    {(!!profile && isSupercastMember(profile.fid) && isMobile) &&
                      <Drawer>
                        <DrawerTrigger className='focus:outline-none'>
                          <SupercastBadge />
                        </DrawerTrigger>
                        <DrawerContent className='focus:outline-none'>
                          <DrawerHeader>
                            <DrawerTitle>Super member</DrawerTitle>
                            <DrawerDescription>@{profile.username} supports supercast development by being an active super member. Legend.</DrawerDescription>
                          </DrawerHeader>
                          <DrawerFooter>
                            <DrawerClose>
                              <Button variant='secondary' className='w-full'>Close</Button>
                            </DrawerClose>
                          </DrawerFooter>
                        </DrawerContent>
                      </Drawer>
                    }
                    {(!!profile && isSupercastMember(profile.fid) && !isMobile) &&
                      <HoverCard openDelay={50} closeDelay={100}>
                        <HoverCardTrigger className='hover:cursor-pointer'>
                          <SupercastBadge />
                        </HoverCardTrigger>
                        <HoverCardContent side="bottom" align='center'>
                          <div className='w-80 px-4 py-2'>
                            <h3 className='font-semibold tracking-tight text-lg'>Super member</h3>
                            <p className='text-sm text-gray-500'>@{profile.username} supports super development by being an active supercast member. Legend.</p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    }
                  </div>
                  {!!profile ?
                    <div className='flex gap-y-1 flex-row items-center'>
                      <span className='flex flex-row items-center'>
                        <div className="text-gray-400 mr-2">@{profile.username}</div>
                      </span>
                      {followedByStatus && <div className="text-gray-700 font-medium bg-gray-100 text-xs rounded-md py-0.5 px-2 dark:bg-gray-900 dark:text-gray-500 dark:border dark:border-gray-500">Follows you</div>}
                    </div>
                    :
                    <Skeleton className="w-24 h-5 mb-2" />
                  }
                </div>
              </div>
            </div>
          </div>
          <div className='sm:pl-16 mt-2 sm:mt-0'>
            {!!profile ?
              <div className="mb-2 text-sm dark:text-gray-100 lg:text-md">
                <CastText text={profile.profile.bio.text} />
              </div>
              :
              <Skeleton className="w-80 h-10 mb-2" />
            }
            <div className="flex flex-row gap-x-4 text-sm items-center mb-2">
              {!!profile ?
                <span
                  onClick={() => isMobile ? setShowFollowing(true) : setRightColumnStatus('following')}
                  className="text-gray-700 dark:text-gray-200 hover:underline hover:cursor-pointer"
                >
                  <HoverCard openDelay={50} closeDelay={100}>
                    <HoverCardTrigger>
                      <span className="font-semibold text-black dark:text-gray-100">{formatNumber(profile.following_count)}</span> Following
                    </HoverCardTrigger>
                    <HoverCardContent side="top" className='px-3 py-1'>
                      <span className="font-semibold text-black dark:text-gray-100">{profile.following_count}</span> Following
                    </HoverCardContent>
                  </HoverCard>
                </span>
                :
                <Skeleton className="w-24 h-5" />
              }
              {!!profile
                ?
                <span
                  onClick={() => isMobile ? setShowFollowers(true) : setRightColumnStatus('followers')}
                  className="text-gray-700 dark:text-gray-200 hover:underline hover:cursor-pointer"
                >
                  <HoverCard openDelay={50} closeDelay={100}>
                    <HoverCardTrigger>
                      <span className="font-semibold text-black dark:text-gray-100">{formatNumber(profile.follower_count)}</span> Followers
                    </HoverCardTrigger>
                    <HoverCardContent side="top" className='px-3 py-1'>
                      <span className="font-semibold text-black dark:text-gray-100">{profile.follower_count}</span> Followers
                    </HoverCardContent>
                  </HoverCard>
                </span>
                :
                <Skeleton className="w-24 h-5" />
              }
              {!!profile ?
                isMobile ?
                  <Drawer>
                    <DrawerTrigger className=''>
                      <span className="font-semibold text-black dark:text-gray-100">{profile.fid}</span> FID
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>FID</DrawerTitle>
                        <DrawerDescription>@{profile.username} has FID {profile.fid}.</DrawerDescription>
                      </DrawerHeader>
                      <DrawerFooter>
                        <DrawerClose>
                          <Button variant='secondary' className='w-full'>Close</Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>
                  :
                  <span
                    className="text-gray-700 dark:text-gray-200 hover:underline"
                  >
                    <HoverCard openDelay={50} closeDelay={100}>
                      <HoverCardTrigger>
                        <span className="font-semibold text-black dark:text-gray-100">{profile.fid}</span> FID
                      </HoverCardTrigger>
                      <HoverCardContent side="top" className='px-3 py-1'>
                        <span className="font-semibold text-black dark:text-gray-100">{profile.fid}</span> FID
                      </HoverCardContent>
                    </HoverCard>
                  </span>
                :
                <Skeleton className="w-24 h-5" />
              }
            </div>
            <div className="flex flex-row gap-x-4 text-sm items-center mb-2">
              {(!!profile && !!profile.profile.location?.address) &&
                (isMobile ?
                  <Drawer>
                    <DrawerTrigger>
                      <span className='font-semibold'>{profile.profile.location.address.city}</span>, {profile.profile.location.address.country_code === 'us' ? 'USA' : profile.profile.location.address.country}
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>Location</DrawerTitle>
                        <DrawerDescription>
                          @{profile.username} is currently in {profile.profile.location.address.city}, {profile.profile.location.address.country_code === 'us' ? 'USA' : profile.profile.location.address.country}
                        </DrawerDescription>
                      </DrawerHeader>
                      <DrawerFooter>
                        <DrawerClose>
                          <Button variant='secondary' className='w-full'>Close</Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>
                  :
                  <HoverCard openDelay={50} closeDelay={100}>
                    <HoverCardTrigger>
                      <span className="font-semibold">
                        {profile.profile.location.address.city}
                      </span>, {profile.profile.location.address.country_code === 'us' ? 'USA' : profile.profile.location.address.country}
                    </HoverCardTrigger>
                    <HoverCardContent side="top" className='px-3 py-1'>
                      {profile.profile.location.address.city}, {profile.profile.location.address.country_code === 'us' ? 'USA' : profile.profile.location.address.country}
                    </HoverCardContent>
                  </HoverCard>
                )
              }
              {(!!profile && !!profile.verified_accounts) && (() => {
                const xAccount = profile.verified_accounts.find(acc => acc.platform === 'x');
                if (!xAccount) return null;

                return isMobile ? (
                  <div
                    onClick={() => window.open(`https://x.com/${xAccount.username}`, '_blank', 'noopener,noreferrer')}
                    className="hover:underline cursor-pointer"
                  >
                    <span className="font-semibold text-black dark:text-gray-100">@{xAccount.username}</span> on 𝕏
                  </div>
                ) : (
                  <div
                    onClick={() => window.open(`https://x.com/${xAccount.username}`, '_blank', 'noopener,noreferrer')}
                    className="hover:underline cursor-pointer"
                  >
                    <span className="text-gray-700 dark:text-gray-200 hover:underline">
                      <span className="font-semibold text-black dark:text-gray-100">
                        @{xAccount.username}
                      </span> on 𝕏
                    </span>
                  </div>
                );
              })()}
            </div>
            {(!!profile) &&
              <div className='flex flex-row gap-x-2'>
                {
                  (profile.fid !== supercastUserState.currentFid && !isSuperanonNonAdmin) &&
                  <Button
                    onClick={followingStatus ? handleUnfollow : handleFollow}
                    variant={followingStatus ? 'outline' : 'default'}
                    className='w-full'
                  >
                    {followingStatus ?
                      <div className='flex flex-row items-center gap-x-2'>
                        {isLoadingUnfollow ? <Spinner width='w-4' height='h-4' padding='p-0' margin='m-0' /> : <CheckCircleIcon className="w-4 h-4" />}
                        <span>Following</span>
                      </div>
                      :
                      <div className='flex flex-row items-center gap-x-2'>
                        {isLoadingFollow ? <Spinner width='w-4' height='h-4' padding='p-0' margin='m-0' /> : <UserPlusIcon className="w-4 h-4" />}
                        <span>{!isAuthenticated() ? 'Login to follow' : isGuest() ? 'Create profile to follow' : 'Follow'}</span>
                      </div>
                    }
                  </Button>
                }
                {((profile.fid === supercastUserState.currentFid && !isSuperanonNonAdmin)) && <EditProfileButton
                  displayName={profile.display_name}
                  username={profile.username}
                  avatar={profile.pfp_url}
                  bio={profile.profile.bio.text}
                  connectedAddresses={profile.verified_addresses.eth_addresses}
                  location={{
                    coordinates: profile.profile.location ? {
                      lat: profile.profile.location.latitude,
                      lng: profile.profile.location.longitude
                    } : null,
                    formatted_address: profile.profile.location ?
                      `${profile.profile.location.address.city}, ${profile.profile.location.address.country}`
                      : '',
                  }}
                />}
              </div>
            }
            {(!!profile && !!relevantFollowerCount && profile.fid !== supercastUserState.currentFid) &&
              <div className="flex flex-row gap-x-2 items-center mt-2">
                <div className="flex flex-row items-center pr-2 shrink-0">
                  {topRelevantFollowers.map((follower) => (
                    <div
                      key={follower.fid}
                      className='-mr-2 shrink-0'
                    >
                      <Avatar className='h-7 w-7'>
                        <AvatarImage
                          src={follower.pfp_url}
                          className='hover:cursor-pointer'
                        />
                        <AvatarFallback>
                          <Skeleton
                            className="h-7 w-7"
                          />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                </div>
                <p className='text-xs text-gray-700 dark:text-gray-300 flex flex-row flex-wrap gap-x-1'>
                  <span className=''>Followed by</span>
                  {topRelevantFollowers.length > 2 &&
                    topRelevantFollowers.slice(0, 2).map((follower) => (
                      <Link key={follower.fid} href={follower.username} className="hover:underline">{`${follower.display_name},`}</Link>
                    ))
                  }
                  {topRelevantFollowers.length > 2 &&
                    <span
                      onClick={() => isMobile ? setShowRelevantFollowers(true) : setRightColumnStatus('relevant_follows')}
                      className="hover:underline hover:cursor-pointer"
                    >
                      {`and ${relevantFollowerCount - 2} others`}
                    </span>
                  }
                  {topRelevantFollowers.length == 2 &&
                    <>
                      <Link href={topRelevantFollowers[0].username} className="hover:underline">{`${topRelevantFollowers[0].display_name}`}</Link>
                      <span className=''>and</span>
                      <Link href={topRelevantFollowers[1].username} className="hover:underline">{`${topRelevantFollowers[1].display_name}`}</Link>
                    </>
                  }
                  {topRelevantFollowers.length == 1 &&
                    <Link href={topRelevantFollowers[0].username} className="hover:underline">{`${topRelevantFollowers[0].display_name}`}</Link>
                  }
                </p>
              </div>
            }
          </div>
        </div>
      </div>
      <div className='gap-y-2 px-4 sm:px-6 lg:px-8 border-b dark:border-gray-800'>
        {/* two tabs, "all" and "mentions" */}
        <div className='flex flex-row'>
          <button
            className={`w-1/2 flex flex-row justify-center py-2 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 ${feedMode == 'casts' && 'border-b-4'}`}
            onClick={() => setFeedMode('casts')}
          >
            <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>Casts</span>
          </button>
          <button
            className={`w-1/2 flex flex-row justify-center py-2 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 ${feedMode == 'replies' && 'border-b-4'}`}
            onClick={() => setFeedMode('replies')}
          >
            <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>Replies</span>
          </button>
          <button
            className={`w-1/2 flex flex-row justify-center py-2 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 ${feedMode == 'highlights' && 'border-b-4'}`}
            onClick={() => setFeedMode('highlights')}
          >
            <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>Highlights</span>
          </button>
          <button
            className={`w-1/2 flex flex-row justify-center py-2 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 ${feedMode == 'likes' && 'border-b-4'}`}
            onClick={() => setFeedMode('likes')}
          >
            <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>Likes</span>
          </button>
        </div>
      </div>
      {feedMode === 'casts' && (
        castsQuery.status === 'success' ? (
          <ul role="list" className="">
            {castsQuery.data.pages.map((page, i) => (
              <React.Fragment key={i}>
                {page.casts.map((cast, castIndex) => (
                  <li
                    className="px-4 sm:px-6 lg:px-8 sm:hover:bg-gray-50 hover:cursor-pointer border-b dark:border-gray-800 sm:dark:hover:bg-gray-800"
                    key={cast.hash}
                  >
                    {castIndex === 5 && <div ref={inViewRef}></div>}
                    <CastInFeed cast={cast} />
                  </li>
                ))}
              </React.Fragment>
            ))}
          </ul>
        ) : (
          renderSkeletons()
        )
      )}
      {feedMode === 'replies' && (
        repliesQuery.status === 'success' ? (
          <ul role="list">
            {repliesQuery.data.pages.map((page, i) => (
              <React.Fragment key={i}>
                {page.casts.map((cast, castIndex) => (
                  <li
                    className="px-4 sm:px-6 lg:px-8 sm:hover:bg-gray-50 hover:cursor-pointer border-b dark:border-gray-800 sm:dark:hover:bg-gray-800"
                    key={cast.hash}
                  >
                    {cast.profileRecast &&
                      <div className='flex flex-row items-center pl-7'>
                        <ArrowPathRoundedSquareIcon className='w-3 h-3 mr-2 text-gray-500' />
                        <p className='text-gray-500 dark:text-gray-500 text-xs font-medium'>
                          {profile.display_name} recasted
                        </p>
                      </div>
                    }
                    {castIndex === 5 && <div ref={inViewRef}></div>}
                    <CastInFeed cast={cast} />
                  </li>
                ))}
              </React.Fragment>
            ))}
          </ul>
        ) : (
          renderSkeletons()
        )
      )}
      {feedMode === 'highlights' && (
        highlightsQuery.status === 'success' ? (
          <ul role="list">
            {highlightsQuery.data.casts.map((cast) => (
              <li
                className="px-4 sm:px-6 lg:px-8 sm:hover:bg-gray-50 hover:cursor-pointer border-b dark:border-gray-800 sm:dark:hover:bg-gray-800"
                key={cast.hash}
              >
                <CastInFeed cast={cast} />
              </li>
            ))}
          </ul>
        ) : (
          renderSkeletons()
        )
      )}
      {feedMode === 'likes' && (
        likesQuery.status === 'success' ? (
          <ul role="list">
            {likesQuery.data.pages.map((page, i) => (
              <React.Fragment key={i}>
                {page.casts.map((cast, castIndex) => (
                  <li
                    className="px-4 sm:px-6 lg:px-8 sm:hover:bg-gray-50 hover:cursor-pointer border-b dark:border-gray-800 sm:dark:hover:bg-gray-800"
                    key={cast.hash}
                  >
                    {castIndex === 5 && <div ref={inViewRef}></div>}
                    <CastInFeed cast={cast} />
                  </li>
                ))}
              </React.Fragment>
            ))}
          </ul>
        ) : (
          renderSkeletons()
        )
      )}
      {(castsQuery.isFetchingNextPage || repliesQuery.isFetchingNextPage || likesQuery.isFetchingNextPage) &&
        renderSkeletons()
      }

      {/* Add the following overlay */}
      {showFollowing && (
        <div className="fixed inset-0 z-[48] overflow-y-auto overscroll-none bg-black bg-opacity-50 flex justify-center items-start lg:hidden">
          <div className="relative bg-white dark:bg-gray-900 w-full min-h-screen shadow-xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-2">
              <div className="flex justify-between items-center pt-2 px-1">
                <div className="w-11"></div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Following
                </h2>
                <Button
                  onClick={() => setShowFollowing(false)}
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <ProfileFollowing
              setRightColumnStatus={() => { }}
              fid={profile.fid}
              type="following"
            />
          </div>
        </div>
      )}

      {/* Followers overlay */}
      {showFollowers && (
        <div className="fixed inset-0 z-[48] overflow-y-auto overscroll-none bg-black bg-opacity-50 flex justify-center items-start lg:hidden">
          <div className="relative bg-white dark:bg-gray-900 w-full min-h-screen shadow-xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-2">
              <div className="flex justify-between items-center pt-2 px-1">
                <div className="w-11"></div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Followers
                </h2>
                <Button
                  onClick={() => setShowFollowers(false)}
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <ProfileFollowing
              setRightColumnStatus={() => { }}
              fid={profile.fid}
              type="followers"
            />
          </div>
        </div>
      )}

      {/* Relevant Followers overlay */}
      {showRelevantFollowers && (
        <div className="fixed inset-0 z-[48] overflow-y-auto overscroll-none bg-black bg-opacity-50 flex justify-center items-start lg:hidden">
          <div className="relative bg-white dark:bg-gray-900 w-full min-h-screen shadow-xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-2">
              <div className="flex justify-between items-center pt-2 px-1">
                <div className="w-11"></div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Followers you follow
                </h2>
                <Button
                  onClick={() => setShowRelevantFollowers(false)}
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <ProfileFollowing
              setRightColumnStatus={() => { }}
              fid={profile.fid}
              type="relevant_follows"
            />
          </div>
        </div>
      )}
    </div>
  )
}
