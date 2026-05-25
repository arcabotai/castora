'use client'

import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import { Button } from '../ui/button'
import axios from 'axios'
import { HOST_URL } from '@/utils/hostURL'
import { useQuery } from 'react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { SUPERANON_ADMIN_FIDS } from '@/utils/anon/admin'
import { notFound } from 'next/navigation'
import SuperChannelTrendingPosts from './SuperChannelTrendingPosts'
import SuperanonRecentPosts from './SuperanonRecentPosts'
import Link from 'next/link'
import Image from 'next/image'
import { useCheckoutDialog } from '@/hooks/useCheckoutDialog'
import { PRODUCT_TYPE } from '@prisma/client'
import FeedHeader from '../FeedHeader'
import Leaderboards from './Leaderboards'

const GROUPCHAT_NAME_TO_ID = {
  "supercasters": "de8f16ad7e23cee11364d5984135abf46a99782eae5fe5b33184c0b6a4fa57e7",
  "alpha": "ecf5275b7e77a9d6603aea36362c38c4a38ccd4261e08ca868b4571807fd1cb6",
  "support": "127fd7badd507b2b6b0ea66694f4a50c00c6c92f8c9aaa2fd172ff6d0d68b6c1"
}


export default function CommunityDashboard() {
  const { supercastUserState, isGuest, isRegularUser, isSuperMember } = useSupercastUserState()
  const { ready, authenticated, getAccessToken } = usePrivy()
  const { openCheckout } = useCheckoutDialog()

  const [loadingSupercastFollow, setLoadingSupercastFollow] = useState(false)
  const [loadingGeneralGroupchatInvite, setLoadingGeneralGroupchatInvite] = useState(false)
  const [loadingAlphaGroupchatInvite, setLoadingAlphaGroupchatInvite] = useState(false)
  const [loadingSupportGroupchatInvite, setLoadingSupportGroupchatInvite] = useState(false)

  const [loadingJoinChannel, setLoadingJoinChannel] = useState(false)

  // TODO remove this and read from warpcast api
  const [generalGroupchatInviteSent, setGeneralGroupchatInviteSent] = useState(false)
  const [alphaGroupchatInviteSent, setAlphaGroupchatInviteSent] = useState(false)
  const [supportGroupchatInviteSent, setSupportGroupchatInviteSent] = useState(false)

  const isSuperanonNonAdmin = supercastUserState.currentFid === Number(process.env.NEXT_PUBLIC_SUPERANON_FID) && !SUPERANON_ADMIN_FIDS.includes(supercastUserState.userFid)

  if (isSuperanonNonAdmin) {
    return notFound()
  }

  const fetchCommunityData = async () => {
    const accessToken = await getAccessToken()
    const response = await axios.get(`${HOST_URL}/api/community/user-state`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
    return response.data
  }

  const communityDataQuery = useQuery(
    ['communityData'],
    fetchCommunityData,
    {
      enabled: isRegularUser(),
    }
  )

  const handleFollowSupercast = async () => {
    setLoadingSupercastFollow(true)
    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/profile/follow`,
      { "followedFid": 193137 },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "asFid": supercastUserState.userFid
        }
      })
      .then(() => {
        communityDataQuery.refetch()
      })
      .catch((error) => {
        toast.error("Error following @super", error)
      })
      .finally(() => {
        setLoadingSupercastFollow(false)
      })
  }

  const handleRequestGroupchatInvite = async (groupchatName: string) => {
    if (groupchatName === "supercasters") {
      setLoadingGeneralGroupchatInvite(true)
    } else if (groupchatName === "alpha") {
      setLoadingAlphaGroupchatInvite(true)
    } else if (groupchatName === "support") {
      setLoadingSupportGroupchatInvite(true)
    }
    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/community/add-to-gc`, {
      groupchatName
    },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "asFid": supercastUserState.currentFid
        }
      })
      .then(() => {
        if (groupchatName === "supercasters") {
          setGeneralGroupchatInviteSent(true)
          window.open(`https://warpcast.com/~/inbox/${GROUPCHAT_NAME_TO_ID["supercasters"]}`, "_blank")
        } else if (groupchatName === "alpha") {
          setAlphaGroupchatInviteSent(true)
          window.open(`https://warpcast.com/~/inbox/${GROUPCHAT_NAME_TO_ID["alpha"]}`, "_blank")
        } else if (groupchatName === "support") {
          setSupportGroupchatInviteSent(true)
          window.open(`https://warpcast.com/~/inbox/${GROUPCHAT_NAME_TO_ID["support"]}`, "_blank")
        }
      })
      .catch((error) => {
        if (error.response.data.error === "NO_PLAN") {
          toast.error("You are not a premium member")
        } else {
          toast.error("Error while adding to groupchats", error)
        }
      })
      .finally(() => {
        if (groupchatName === "supercasters") {
          setLoadingGeneralGroupchatInvite(false)
        } else if (groupchatName === "alpha") {
          setLoadingAlphaGroupchatInvite(false)
        } else if (groupchatName === "support") {
          setLoadingSupportGroupchatInvite(false)
        }
      })
  }

  const handleJoinChannel = async () => {
    setLoadingJoinChannel(true)
    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/community/add-to-channel`, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "asFid": supercastUserState.currentFid
      }
    })
      .then(() => {
        communityDataQuery.refetch()
        window.open(`https://www.super.sc/channel/super`, "_blank")
      })
      .catch((error) => {
        if (error.response.data.error === "NO_PLAN") {
          toast.error("You are not a premium member")
        } else {
          toast.error("Error while adding to groupchats", error)
        }
      })
      .finally(() => {
        setLoadingJoinChannel(false)
      })
  }

  return (
    <div className="pt-12 lg:pt-0">
      <FeedHeader title="Community" />
      <div className='mb-6 mt-2'>
        <h3 className='text-2xl  font-semibold tracking-tight px-4 sm:px-6 lg:px-8 mb-1'>Welcome to super! ツ</h3>
        <p className='text-sm text-gray-500  px-4 sm:px-6 lg:px-8'>Super is more than an app.</p>
        <p className='text-sm text-gray-500  px-4 sm:px-6 lg:px-8 '>It's a community of people who love farcaster and have fun growing it together.</p>
      </div>

      <div className='px-4 sm:px-6 lg:px-8 pb-8'>
        <Leaderboards />
      </div>

      <div className='border-b border-gray-200 dark:border-gray-800 mx-4 sm:mx-6 lg:mx-8 mb-4'></div>

      <div className='mb-4 px-4 sm:px-6 lg:px-8'>
        <h2 className='text-xl font-semibold'>Super artifacts</h2>
        <p className='text-sm text-gray-500'>Series of zora drops, airdropped for free to all supercasters.</p>
      </div>

      <div className='flex flex-col gap-y-4 mb-6 px-4 sm:px-6 lg:px-8'>
        <Link href="https://zora.co/collect/base:0x2a985968efd42a5e15d14e18ee4ad86ea07aa9a9/1?referrer=0xF417ACe7b13c0ef4fcb5548390a450A4B75D3eB3" target="_blank">
          <div className="w-full flex flex-row gap-x-2 py-2 px-4 border border-gray-200 dark:border-gray-700 rounded-xl items-center sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800">
            <Image src="/superanon.png" alt="Castora mark" width={400} height={400} className='w-16 h-16 rounded-lg shrink-0 shadow-sm object-cover' />
            <div className='flex flex-col gap-y-1'>
              <h3 className='text-xl font-semibold'>anon</h3>
              <p className='text-sm text-gray-500'>First super artifact, created on Nov 14th, 2024 to celebrate @superanon</p>
            </div>
          </div>
        </Link>
        <div className='relative'>
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <p className='text-sm'>More super artifacts are coming. Become a member to get them.</p>
          </div>
          <div className="w-full flex flex-row gap-x-2 py-2 px-4 border border-gray-200 dark:border-gray-700 rounded-xl items-center sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800">
            <Image src="/castora-mark.svg" alt="Castora mark" width={400} height={400} className='w-16 h-16 rounded-lg shrink-0 shadow-sm object-cover' />
            <div className='flex flex-col gap-y-1'>
              <h3 className='text-xl font-semibold'>This is alpha</h3>
              <p className='text-sm text-gray-500'>Wow you are so smart you can inspect the element wow</p>
            </div>
          </div>
        </div>
      </div>

      <div className='border-b border-gray-200 dark:border-gray-800 mx-4 sm:mx-6 lg:mx-8 mb-4'></div>

      <div className='mb-4'>
        <h2 className='text-xl font-semibold px-4 sm:px-6 lg:px-8'>Join the community</h2>
        <p className='text-sm text-gray-500 px-4 sm:px-6 lg:px-8'>{isGuest() ? `Finish onboarding to get access to the community.` : `Join the channel and the groupchats to meet new friends, learn about new opportunities, and get the $DEGEN tips.`}</p>
      </div>
      <div className="relative">
        {isGuest() && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <Button
              className='px-16'
              onClick={() => window.location.href = '/onboarding'}
            >
              Create profile
            </Button>
          </div>
        )}
        {(isRegularUser() && !isSuperMember()) && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <Button
              onClick={() => {
                openCheckout(PRODUCT_TYPE.MEMBERSHIP)
              }}
            >
              Become a member to join
            </Button>
          </div>
        )}
        <ul className='flex flex-col gap-y-4 lg:gap-y-2 px-4 sm:px-6 lg:px-8 pb-6'>
          <li className='flex flex-col lg:flex-row justify-between items-center gap-y-2 lg:gap-x-2'>
            <div className='flex flex-col'>
              <p className='font-medium'>Follow @super</p>
              <p className='text-sm text-gray-500 w-full lg:max-w-sm'>Follow our account so we can add you to the channel and the groupchats.</p>
            </div>
            <Button
              className='w-full lg:w-40'
              disabled={loadingSupercastFollow || communityDataQuery.data?.following}
              onClick={handleFollowSupercast}
            >
              {loadingSupercastFollow ? <Loader2 className='animate-spin' /> : communityDataQuery.data?.following ? "Following" : "Follow @super"}
            </Button>
          </li>
          <li className='flex flex-col lg:flex-row justify-between items-center gap-y-2 lg:gap-x-2'>
            <div className='flex flex-col'>
              <p className='font-medium'>Legacy community channel</p>
              <p className='text-sm text-gray-500 w-full lg:max-w-sm'>Legacy Supercast community features are disabled for Castora beta.</p>
            </div>
            <Button
              className='w-full lg:w-40'
              disabled={loadingJoinChannel || !communityDataQuery.data?.following || communityDataQuery.data?.channelMember}
              onClick={handleJoinChannel}
            >
              {loadingJoinChannel ? <Loader2 className='animate-spin' /> : communityDataQuery.data?.channelMember ? "Joined channel" : "Join channel"}
            </Button>
          </li>
          <li className='flex flex-col gap-y-2'>
            <div className='flex flex-col'>
              <p className='font-medium'>Join the groupchats</p>
              <p className='text-sm text-gray-500 w-full'>Warpcast groupchats are where most of the action happens.</p>
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 w-full'>
              <Button
                className='w-full'
                disabled={loadingGeneralGroupchatInvite || !communityDataQuery.data?.following || communityDataQuery.data?.groupchatMember || generalGroupchatInviteSent}
                onClick={() => handleRequestGroupchatInvite("supercasters")}
              >
                {loadingGeneralGroupchatInvite ? <Loader2 className='animate-spin' /> : generalGroupchatInviteSent ? "Added to supercasters" : "Join general chat"}
              </Button>
              <Button
                className='w-full'
                disabled={loadingAlphaGroupchatInvite || !communityDataQuery.data?.following || communityDataQuery.data?.groupchatMember || alphaGroupchatInviteSent}
                onClick={() => handleRequestGroupchatInvite("alpha")}
              >
                {loadingAlphaGroupchatInvite ? <Loader2 className='animate-spin' /> : alphaGroupchatInviteSent ? "Added to alpha chat" : "Join alpha chat"}
              </Button>
              <Button
                className='w-full'
                disabled={loadingSupportGroupchatInvite || !communityDataQuery.data?.following || communityDataQuery.data?.groupchatMember || supportGroupchatInviteSent}
                onClick={() => handleRequestGroupchatInvite("support")}
              >
                {loadingSupportGroupchatInvite ? <Loader2 className='animate-spin' /> : supportGroupchatInviteSent ? "Added to support chat" : "Join support chat"}
              </Button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}
