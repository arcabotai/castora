import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { HOST_URL } from '@/utils/hostURL'
import { usePrivy } from '@privy-io/react-auth'
import { useOpenSignerApproval } from '@/providers/OpenSignerApprovalProvider'
import { PlusIcon, CheckIcon } from '@heroicons/react/20/solid'
import { Button } from '../ui/button'
import Spinner from '../Spinner'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  authorFid: number
  initialFollowingStatus: boolean
  className?: string
}

export default function FollowButton({ authorFid, initialFollowingStatus, className = '' }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowingStatus)
  const [showCheckmark, setShowCheckmark] = useState(false)
  const [isLoadingFollow, setIsLoadingFollow] = useState(false)
  const { getAccessToken } = usePrivy()
  const { setOpenSignerApproval } = useOpenSignerApproval()
  const { supercastUserState, isAuthenticated, isGuest } = useSupercastUserState()

  const router = useRouter()

  useEffect(() => {
    setIsFollowing(initialFollowingStatus)
  }, [initialFollowingStatus])

  const handleFollow = async (e) => {
    e.stopPropagation()
    e.preventDefault()

    if (isGuest()) {
      router.push('/onboarding')
      return
    }

    setIsLoadingFollow(true)
    const accessToken = await getAccessToken()

    try {
      await axios.post(`${HOST_URL}/api/profile/follow`, {
        followedFid: authorFid,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'asFid': supercastUserState.currentFid,
        }
      })
      setIsFollowing(true)
      setShowCheckmark(true)
      // Hide the checkmark after 2 seconds
      setTimeout(() => setShowCheckmark(false), 2000)
    } catch (error) {
      if (error.response?.data.error === "NO_SIGNER_APPROVED") {
        setOpenSignerApproval(true)
      } else {
        toast.error('Error following the user')
      }
    } finally {
      setIsLoadingFollow(false)
    }
  }

  if (!isAuthenticated() || authorFid === supercastUserState.currentFid || (isFollowing && !showCheckmark)) {
    return null
  }

  return (
    <Button
      onClick={handleFollow}
      disabled={isLoadingFollow || showCheckmark}
      className={`w-5 h-5 p-0 rounded-full border border-white dark:border-black disabled:opacity-100 ${className}`}
    >
      {isLoadingFollow ? (
        <Spinner width='w-3' height='h-3' color='text-white' fill='fill-black' />
      ) : showCheckmark ? (
        <CheckIcon className="w-3 h-3" />
      ) : (
        <PlusIcon className="w-4 h-4" />
      )}
    </Button>
  )
}