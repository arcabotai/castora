'use client'
import {
  ChatBubbleLeftIcon as ChatBubbleLeftIconOutline,
  HeartIcon as HeartIconOutline,
  ArrowPathRoundedSquareIcon as ArrowPathRoundedSquareIconOutline,
  BookmarkIcon as BookmarkIconOutline,
  ArrowUpTrayIcon as ArrowUpTrayIconOutline,
} from '@heroicons/react/24/outline'
import {
  ChatBubbleLeftIcon as ChatBubbleLeftIconSolid,
  HeartIcon as HeartIconSolid,
  ArrowPathRoundedSquareIcon as ArrowPathRoundedSquareIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  ArrowUpTrayIcon as ArrowUpTrayIconSolid,
} from '@heroicons/react/24/solid'

import { HOST_URL } from '@/utils/hostURL'
import { toast } from 'sonner'
import { usePrivy } from '@privy-io/react-auth'
import axios from 'axios'
import { useOpenSignerApproval } from '@/providers/OpenSignerApprovalProvider'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { formatNumber } from '@/utils/textUtils'

interface ReactionBarProps {
  draftId: string,
  authorFid: number,
  replyCount: number,
  reactionCount: number,
  recastCount: number,
  reactionStatus: boolean,
  recastStatus: boolean,
  setRecastCount: React.Dispatch<React.SetStateAction<number>>,
  setRecastStatus: React.Dispatch<React.SetStateAction<boolean>>,
  setReactionCount: React.Dispatch<React.SetStateAction<number>>,
  setReactionStatus: React.Dispatch<React.SetStateAction<boolean>>,
  login: () => void,
}

export default function DraftPreviewReactionBar({
  draftId,
  authorFid,
  replyCount,
  reactionCount,
  recastCount,
  reactionStatus,
  recastStatus,
  setRecastCount,
  setRecastStatus,
  setReactionCount,
  setReactionStatus,
  login,
}: ReactionBarProps) {

  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()

  const { setOpenSignerApproval } = useOpenSignerApproval()

  const checkIfLoggedIn = async () => {
    const accessToken = await getAccessToken()
    if (!accessToken) {
      login()
      return false
    }

    return true
  }

  const scheduleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const isLoggedIn = await checkIfLoggedIn()

    if (!isLoggedIn) {
      return
    }

    setReactionStatus(true)
    setReactionCount((prev) => prev + 1)

    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/drafts/${draftId}/schedule-like`, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    }).catch((error) => {
      setReactionStatus(false)
      setReactionCount((prev) => prev - 1)
      if (error.response.data.error === "NO_SIGNER_APPROVED") {
        setOpenSignerApproval(true)
      } else {
        toast.error('Error reacting to cast')
      }
    })
  }

  const unscheduleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()

    const isLoggedIn = await checkIfLoggedIn()

    if (!isLoggedIn) {
      return
    }

    setReactionStatus(false)
    setReactionCount((prev) => prev - 1)

    const accessToken = await getAccessToken()

    axios.delete(`${HOST_URL}/api/drafts/${draftId}/unschedule-like`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    }).catch((error) => {
      setReactionStatus(true)
      setReactionCount((prev) => prev + 1)
      if (error.response.data.error === "NO_SIGNER_APPROVED") {
        setOpenSignerApproval(true)
      } else {
        toast.error('Error reacting to cast')
      }
    })
  }

  const scheduleRecast = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const isLoggedIn = await checkIfLoggedIn()

    if (!isLoggedIn) {
      return
    }

    setRecastStatus(true)
    setRecastCount((prev) => prev + 1)

    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/drafts/${draftId}/schedule-recast`, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    }).catch((error) => {
      setRecastStatus(false)
      setRecastCount((prev) => prev - 1)
      if (error.response.data.error === "NO_SIGNER_APPROVED") {
        setOpenSignerApproval(true)
      } else {
        toast.error('Error reacting to cast')
      }
    })
  }

  const unscheduleRecast = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()

    const isLoggedIn = await checkIfLoggedIn()

    if (!isLoggedIn) {
      return
    }

    setRecastStatus(false)
    setRecastCount((prev) => prev - 1)

    const accessToken = await getAccessToken()

    axios.delete(`${HOST_URL}/api/drafts/${draftId}/unschedule-recast`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    }).catch((error) => {
      setRecastStatus(true)
      setRecastCount((prev) => prev + 1)
      if (error.response.data.error === "NO_SIGNER_APPROVED") {
        setOpenSignerApproval(true)
      } else {
        toast.error('Error reacting to cast')
      }
    })
  }

  return (
    <div className="flex flex-row items-center justify-between w-full">
      <div className='flex flex-row items-center justify-start'>
        <div className='w-14 max-h-5'>
          <button className='flex flex-row items-center gap-x-1 group'>
            <div className='w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-purple-300 opacity-40 absolute -ml-1 hidden group-active:block sm:group-hover:block'></div>
            <ChatBubbleLeftIconOutline className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-purple-600" />
            <span className="text-gray-400 text-sm group-hover:text-purple-600">{formatNumber(replyCount)}</span>
          </button>
        </div>
        <div className='w-14 max-h-5'>
          <button
            onClick={recastStatus
              ? (e) => unscheduleRecast(e)
              : (e) => scheduleRecast(e)
            }
            className='flex flex-row items-center gap-x-1 group'
          >
            <div className='w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-green-300 opacity-40 absolute -ml-1 hidden group-active:block sm:group-hover:block'></div>
            {recastStatus
              ? <ArrowPathRoundedSquareIconSolid className="w-5 h-5 sm:w-4 sm:h-4 text-green-500" />
              : <ArrowPathRoundedSquareIconOutline className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-green-500" />
            }
            <span className={`text-sm text-gray-400 group-hover:text-green-500 ${recastStatus && "text-green-500"}`}>{formatNumber(recastCount)}</span>
          </button>
        </div>
        <div className='w-14 max-h-5'>
          <button
            onClick={reactionStatus
              ? (e) => unscheduleLike(e)
              : (e) => scheduleLike(e)
            }
            className='flex flex-row items-center gap-x-1 group'
          >
            <div className='w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-red-300 opacity-40 absolute -ml-1 hidden group-active:block sm:group-hover:block'></div>
            {reactionStatus
              ? <HeartIconSolid className="w-5 h-5 sm:w-4 sm:h-4 text-red-600" />
              : <HeartIconOutline className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-red-600" />
            }
            <span className={`text-sm text-gray-400 group-hover:text-red-600 ${reactionStatus && "text-red-600"}`}>{formatNumber(reactionCount)}</span>
          </button>
        </div>
      </div>
      <div className='flex flex-row items-center justify-end max-w-[280px] xs:max-w-[310px]'>
      </div>
    </div>
  )
}