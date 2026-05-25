'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { HOST_URL } from "@/utils/hostURL"
import { usePrivy } from "@privy-io/react-auth"
import axios from "axios"
import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "react-query"
import { Skeleton } from "../ui/skeleton"
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import Link from "next/link"

type LeaderboardMode = 'membership' | 'superanon-7d' | 'superanon-lifetime'

type LeaderboardEntry = {
  fid: number
  username: string
  avatar: string
  score: number
}

// Format time remaining function
const formatTimeRemaining = (timestamp: number) => {
  const now = new Date().getTime()
  const diff = timestamp - now

  // Convert to days, months, years
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const months = Math.floor(days / 30)
  const years = Math.floor(months / 12)

  if (years > 0) {
    const remainingMonths = months % 12
    if (remainingMonths > 0) {
      const remainingDays = days % 30
      if (remainingDays > 0) {
        return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}, ${remainingDays} day${remainingDays > 1 ? 's' : ''}`
      }
      return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
    }
    return `${years} year${years > 1 ? 's' : ''}`
  }

  if (months > 0) {
    const remainingDays = days % 30
    if (remainingDays > 0) {
      return `${months} month${months > 1 ? 's' : ''}, ${remainingDays} day${remainingDays > 1 ? 's' : ''}`
    }
    return `${months} month${months > 1 ? 's' : ''}`
  }

  return `${days} day${days > 1 ? 's' : ''}`
}

export default function Leaderboards() {
  const [mode, setMode] = useState<LeaderboardMode>('membership')
  const [isExpanded, setIsExpanded] = useState(false)
  const { getAccessToken } = usePrivy()
  const { isAuthenticated, isGuest, isRegularUser } = useSupercastUserState()
  const queryClient = useQueryClient()
  const [isOptingIn, setIsOptingIn] = useState(false)
  const [isOptedIn, setIsOptedIn] = useState(false)

  const fetchMembershipLeaderboard = async () => {
    const accessToken = await getAccessToken()
    const response = await axios.get(`${HOST_URL}/api/community/leaderboard/membership`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    })
    return response.data as LeaderboardEntry[]
  }

  const fetchSuperanonLeaderboard7d = async () => {
    const accessToken = await getAccessToken()
    const response = await axios.get(`${HOST_URL}/api/community/leaderboard/superanon?days=7`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    })
    return response.data as LeaderboardEntry[]
  }

  const fetchSuperanonLeaderboardLifetime = async () => {
    const accessToken = await getAccessToken()
    const response = await axios.get(`${HOST_URL}/api/community/leaderboard/superanon`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    })
    return response.data as LeaderboardEntry[]
  }

  const fetchSuperanonOptInStatus = async () => {
    const accessToken = await getAccessToken()
    const response = await axios.get(`${HOST_URL}/api/community/leaderboard/superanon/opt-in-status`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    })
    return response.data.optedIn
  }

  const { data: membershipData, isLoading: membershipLoading } = useQuery(
    ['membershipLeaderboard'],
    fetchMembershipLeaderboard,
    { enabled: isAuthenticated() }
  )

  const { data: superanonData, isLoading: superanonLoading } = useQuery(
    ['superanonLeaderboard7d'],
    fetchSuperanonLeaderboard7d,
    { enabled: isAuthenticated() }
  )

  const { data: superanonLifetimeData, isLoading: superanonLifetimeLoading } = useQuery(
    ['superanonLeaderboardLifetime'],
    fetchSuperanonLeaderboardLifetime,
    { enabled: isAuthenticated() }
  )

  const { data: optInStatus, isLoading: optInStatusLoading } = useQuery(
    ['superanonOptInStatus'],
    fetchSuperanonOptInStatus,
    {
      enabled: isRegularUser(),
    }
  )

  useEffect(() => {
    if (optInStatus) {
      setIsOptedIn(optInStatus)
    }
  }, [optInStatus])

  // Replace the mock data with the real data
  const data = mode === 'membership' ? membershipData : mode === 'superanon-7d' ? superanonData : superanonLifetimeData
  const isLoading = mode === 'membership' ? membershipLoading : mode === 'superanon-7d' ? superanonLoading : superanonLifetimeLoading

  const handleSuperanonOptIn = async () => {
    setIsOptingIn(true)

    const accessToken = await getAccessToken()

    axios.put(
      `${HOST_URL}/api/community/leaderboard/superanon/opt-in-status/toggle`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      }
    ).then(() => {
      setIsOptedIn(!isOptedIn)
      queryClient.invalidateQueries(['superanonOptInStatus'])
    }).catch((error) => {
      console.error('Error toggling opt-in status:', error)
    }).finally(() => {
      setIsOptingIn(false)
    })
  }

  const visibleData = isExpanded ? data : data?.slice(0, 6)

  return (
    <div className="flex flex-col gap-y-4">
      <div className=''>
        <h2 className='text-xl font-semibold'>Leaderboards</h2>
        <p className='text-sm text-gray-500'>
          Compete with other community members to earn status and rewards.
        </p>
      </div>

      <div className="flex flex-col gap-y-2">
        <div className="flex gap-x-2 w-full overflow-x-auto">
          <Button
            variant={mode === 'membership' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('membership')}
          >
            Membership
          </Button>
          <Button
            variant={mode === 'superanon-7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('superanon-7d')}
          >
            Superanon (7d)
          </Button>
          <Button
            variant={mode === 'superanon-lifetime' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('superanon-lifetime')}
          >
            Superanon (lifetime)
          </Button>
        </div>
        <p className='text-sm text-gray-500'>
          {mode === 'membership'
            ? 'Most dedicated members ranked by membership duration'
            : 'Join the leaderboard to get weekly rewards and flex your superanon shitposting skills'}
        </p>
      </div>

      <div className="relative">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-x-3 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative">
            {data?.length === 0 && (
              <p className="text-sm text-gray-500 text-center">Leaderboard data currently not available</p>
            )}
            <ol className="space-y-2">
              {visibleData?.map((entry, index) => (
                <li
                  key={entry.fid}
                >
                  <Link
                    href={`/${entry.username}`}
                    className="flex items-center gap-x-3 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800"
                  >
                    {index === 0 && <span className="text-md font-semibold w-6">🥇</span>}
                    {index === 1 && <span className="text-md font-semibold w-6">🥈</span>}
                    {index === 2 && <span className="text-md font-semibold w-6">🥉</span>}
                    {index > 2 && <span className="text-md font-semibold w-6">{index + 1}</span>}
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={entry.avatar} />
                      <AvatarFallback>
                        <Image src={"/castora-mark.svg"} alt={entry.username} width={24} height={24} />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {entry.username ? `@${entry.username}` : `FID: ${entry.fid}`}
                    </span>
                    <span className="ml-auto text-sm text-gray-500 truncate">
                      {mode === 'membership'
                        ? formatTimeRemaining(entry.score)
                        : `${entry.score.toFixed(2)} points`}
                    </span>
                  </Link>
                </li>
              ))}
              {(!isExpanded && data && data.length > 6) && <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-900 to-transparent flex items-end">
                <Button
                  variant="link"
                  className="w-full"
                  onClick={() => setIsExpanded(true)}
                >
                  Show full leaderboard
                </Button>
              </div>}
            </ol>
            {(isExpanded && data && data.length > 6) &&
              <Button
                variant="link"
                className="w-full"
                onClick={() => setIsExpanded(false)}
              >
                Show less
              </Button>
            }
          </div>
        )}
        {(mode === 'superanon-7d' || mode === 'superanon-lifetime') && (
          <div className="flex flex-row gap-x-2 items-center mt-2 justify-between">
            <p className="text-sm text-gray-500">Only people who opt in are shown on the leaderboard.</p>
            {isGuest() && (
              <Button
                size="sm"
                onClick={() => window.location.href = '/onboarding'}
              >
                Create profile to join leaderboard
              </Button>
            )}
            {!isGuest() && (
              <Button
                size="sm"
                onClick={handleSuperanonOptIn}
                disabled={optInStatusLoading || isOptingIn}
              >
                {isOptingIn && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isOptedIn ? 'Remove me' : 'Join the leaderboard'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 