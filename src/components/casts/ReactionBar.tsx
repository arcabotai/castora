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

import RecastButton from './RecastButton'
import { HOST_URL } from '@/utils/hostURL'
import { toast } from 'sonner'
import { usePrivy } from '@privy-io/react-auth'
import axios from 'axios'
import { useOpenSignerApproval } from '@/providers/OpenSignerApprovalProvider'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import BoostRequestReactionButton from './BoostRequestReactionButton'
import { formatNumber } from '@/utils/textUtils'
import CastOptions from './CastOptions'
import { isMobile } from 'react-device-detect'
import { useSelectedCast } from '@/providers/SelectedCastProvider'
import { useHotkeys } from 'react-hotkeys-hook'
import { useInteractions } from '@/providers/InteractionProvider'
import { useState, useEffect } from 'react'
import { useSuperLogin } from '@/hooks/useSuperLogin'
import { useRouter } from 'next/navigation'

interface ReactionBarProps {
  castHash: string,
  authorFid: number,
  replyCount: number,
  reactionCount: number,
  recastCount: number,
  bookmarkCount: number,
  reactionStatus: boolean,
  recastStatus: boolean,
  bookmarkStatus: boolean,
  setRecastCount: React.Dispatch<React.SetStateAction<number>>,
  setRecastStatus: React.Dispatch<React.SetStateAction<boolean>>,
  setReactionCount: React.Dispatch<React.SetStateAction<number>>,
  setReactionStatus: React.Dispatch<React.SetStateAction<boolean>>,
  setBookmarkCount: React.Dispatch<React.SetStateAction<number>>,
  setBookmarkStatus: React.Dispatch<React.SetStateAction<boolean>>,
  isSelected?: boolean,
  isCastDetail?: boolean,
}

export default function ReactionBar({
  castHash,
  authorFid,
  replyCount,
  reactionCount: initialReactionCount,
  recastCount,
  bookmarkCount,
  reactionStatus: initialReactionStatus,
  recastStatus,
  bookmarkStatus,
  setRecastCount,
  setRecastStatus,
  setReactionCount,
  setReactionStatus: setLocalReactionStatus,
  setBookmarkCount,
  setBookmarkStatus,
  isSelected = false,
  isCastDetail = false
}: ReactionBarProps) {

  const { supercastUserState, isAuthenticated, isGuest } = useSupercastUserState()
  const { getAccessToken } = usePrivy()
  const { hash: selectedCastHash } = useSelectedCast()
  const { setOpenSignerApproval } = useOpenSignerApproval()
  const { likedCasts, addLikedCast, removeLikedCast, getLikeCount, isLiked, isOverridden } = useInteractions();

  const { login } = useSuperLogin();
  const router = useRouter();

  const overridden = isOverridden(castHash, 'like')

  const reactToCast = async () => {
    addLikedCast(castHash, overridden ? getLikeCount(castHash) : initialReactionCount)

    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/reactions/like`, {
      hash: castHash
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    }).catch((error) => {
      removeLikedCast(castHash, overridden ? getLikeCount(castHash) : initialReactionCount)
      if (error.response.data.error === "NO_SIGNER_APPROVED") {
        setOpenSignerApproval(true)
      } else {
        toast.error('Error reacting to cast')
      }
    })
  }

  const unreactToCast = async () => {
    removeLikedCast(castHash, overridden ? getLikeCount(castHash) : initialReactionCount)
    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/reactions/unlike`, {
      hash: castHash
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    }).catch((error) => {
      addLikedCast(castHash, overridden ? getLikeCount(castHash) : initialReactionCount)
      if (error.response.data.error === "NO_SIGNER_APPROVED") {
        setOpenSignerApproval(true)
      } else {
        toast.error('Error unreacting to cast')
      }
    })
  }

  const bookmarkCast = async (
    e: React.MouseEvent<HTMLButtonElement>,
    setBookmarkCount: React.Dispatch<React.SetStateAction<number>>,
    setBookmarkStatus: React.Dispatch<React.SetStateAction<boolean>>,
    bookmarkCount: number,
    hash: string,
  ) => {
    e.stopPropagation()
    e.preventDefault()

    if (!isAuthenticated()) {
      login()
      return
    } else if (isGuest()) {
      router.push('/onboarding')
      return
    }

    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/reactions/bookmark`, { "castHash": hash }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    }).then(() => {
      toast.success('Added to bookmarks')
    })
    setBookmarkStatus(true)
  }

  const unbookmarkCast = async (
    e: React.MouseEvent<HTMLButtonElement>,
    setBookmarkCount: React.Dispatch<React.SetStateAction<number>>,
    setBookmarkStatus: React.Dispatch<React.SetStateAction<boolean>>,
    bookmarkCount: number,
    hash: string
  ) => {
    e.stopPropagation()
    e.preventDefault()

    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/reactions/unbookmark`, { "castHash": hash }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }

    })
    setBookmarkStatus(false)
    setBookmarkCount(bookmarkCount - 1)
  }

  const handleLikeCastClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated()) {
      login()
      return
    } else if (isGuest()) {
      router.push('/onboarding')
      return
    }

    if (overridden ? isLiked(castHash) : initialReactionStatus) {
      unreactToCast()
    } else {
      reactToCast()
    }
  }

  const handleLikeCastHotkey = async (e: KeyboardEvent) => {
    if ((selectedCastHash === castHash && isCastDetail) || (isSelected && !selectedCastHash)) {
      if (overridden ? isLiked(castHash) : initialReactionStatus) {
        unreactToCast()
      } else {
        reactToCast()
      }
    }
  }

  useHotkeys(
    'l',
    handleLikeCastHotkey,
    { preventDefault: true },
    [
      selectedCastHash,
      overridden,
      isLiked(castHash),
      isCastDetail,
      initialReactionStatus,
      initialReactionCount,
      getLikeCount(castHash),
      castHash,
      isSelected
    ]
  )

  const buttonClass = 'flex flex-row items-center gap-x-1 group transition-all duration-150 ease-out active:scale-95 sm:active:scale-100'
  const backgroundCircleClass = 'w-9 h-9 sm:w-7 sm:h-7 rounded-full opacity-40 absolute -ml-[6px] -mt-[1px] sm:-ml-1 sm:-mt-[2px] scale-0 group-active:scale-100 sm:group-hover:scale-100 transition-all duration-50 ease-out'
  const iconClass = 'w-6 h-6 sm:w-5 sm:h-5 shrink-0 transition-colors duration-150 ease-out'

  return (
    <div className="flex flex-row items-center justify-between w-full">
      <div className='flex flex-row items-center justify-start'>
        <button className={`${buttonClass} w-11 h-9 py-2`}>
          <div className={`${backgroundCircleClass} bg-purple-300`}></div>
          <ChatBubbleLeftIconOutline className={`${iconClass} text-gray-400 group-active:text-purple-600 sm:group-hover:text-purple-600`} />
          <span className="text-gray-400 text-sm group-active:text-purple-600 sm:group-hover:text-purple-600">{formatNumber(replyCount)}</span>
        </button>
        <RecastButton
          castHash={castHash}
          authorFid={authorFid}
          recastCount={recastCount}
          recastStatus={recastStatus}
          setRecastCount={setRecastCount}
          setRecastStatus={setRecastStatus}
          iconClass={iconClass}
          buttonClass={buttonClass}
          backgroundCircleClass={backgroundCircleClass}
          isSelected={isSelected}
          isCastDetail={isCastDetail}
        />
        <button
          onClick={handleLikeCastClick}
          className={`${buttonClass} w-16 h-9 py-2 pl-3`}
        >
          <div className={`${backgroundCircleClass} bg-red-300`}></div>
          {(overridden ? isLiked(castHash) : initialReactionStatus)
            ? <HeartIconSolid className={`${iconClass} text-red-600`} />
            : <HeartIconOutline className={`${iconClass} text-gray-400 group-active:text-red-600 sm:group-hover:text-red-600`} />
          }
          <span className={`text-sm text-gray-400 group-active:text-red-600 sm:group-hover:text-red-600 ${(overridden ? isLiked(castHash) : initialReactionStatus) && "text-red-600"}`}>{formatNumber(overridden ? getLikeCount(castHash) : initialReactionCount)}</span>
        </button>
      </div>
      <div className='flex flex-row items-center justify-end max-w-[280px] xs:max-w-[310px]'>
        <div className='w-8 max-h-5 flex flex-row items-center'>
          <button
            onClick={bookmarkStatus
              ? (e) => unbookmarkCast(e, setBookmarkCount, setBookmarkStatus, bookmarkCount, castHash)
              : (e) => bookmarkCast(e, setBookmarkCount, setBookmarkStatus, bookmarkCount, castHash)
            }
            className={buttonClass}
          >
            <div className={`${backgroundCircleClass} bg-blue-300`}></div>
            {bookmarkStatus
              ? <BookmarkIconSolid className={`${iconClass} text-blue-600`} />
              : <BookmarkIconOutline className={`${iconClass} text-gray-400 group-active:text-blue-600 sm:group-hover:text-blue-600`} />
            }
          </button>
        </div>
        <div className='w-8 max-h-5 flex flex-row items-center'>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              navigator.clipboard.writeText(`${HOST_URL}/c/${castHash}`)
              toast.success('Supercast link copied to clipboard')
            }}
            className={buttonClass}
          >
            <div className={`${backgroundCircleClass} bg-yellow-300`}></div>
            <ArrowUpTrayIconOutline className={`${iconClass} text-gray-400 group-active:text-yellow-600 sm:group-hover:text-yellow-600`} />
          </button>
        </div>
        <div
          className='w-8 max-h-5 flex flex-row items-center'
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <CastOptions
            authorFid={authorFid}
            userFid={supercastUserState.currentFid}
            castHash={castHash}
            redirectToHash=""
            className={`${buttonClass} w-8 h-9 py-2`}
            iconClassName={`${iconClass} text-gray-400 group-active:text-red-600 sm:group-hover:text-red-600`}
            backgroundClassName={`${backgroundCircleClass} bg-red-300`}
          />
        </div>
      </div>
    </div>
  )
}
