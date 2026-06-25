'use client'

import axios from 'axios'
import { useQuery } from 'react-query'
import { usePrivy } from '@privy-io/react-auth'
import { HOST_URL } from '@/utils/hostURL'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { useSelectedCast } from '@/providers/SelectedCastProvider'
import CastText from './CastText'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Skeleton } from '../ui/skeleton'

// A small, muted preview of the cast a reply/mention is on, shown inline in the
// notification so you have context without opening the thread. Fetches the parent
// by hash (cached by react-query) and quietly renders nothing if it can't load.
export default function ParentCastPreview({ hash }: { hash: string }) {
  const { getAccessToken } = usePrivy()
  const { supercastUserState } = useSupercastUserState()
  const { navigateToCast } = useSelectedCast()

  const { data: cast, isLoading, isError } = useQuery(
    ['parentCast', hash],
    async () => {
      const accessToken = await getAccessToken()
      const response = await axios.get(`${HOST_URL}/api/cast/single?hash=${hash}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          asFid: supercastUserState?.currentFid,
        },
      })
      return response.data.currentCast
    },
    {
      enabled: !!hash,
      staleTime: 30 * 60 * 1000, // 30 min — parents rarely change
      cacheTime: 60 * 60 * 1000,
      retry: 1,
    },
  )

  if (isLoading) {
    return (
      <div className="mb-2 rounded-lg border dark:border-gray-800 p-2">
        <Skeleton className="h-3 w-3/4" />
      </div>
    )
  }

  // Couldn't load (deleted / not found) — show nothing rather than a broken box.
  if (isError || !cast?.author) return null

  return (
    <div
      onClick={(e) => { e.stopPropagation(); navigateToCast(e, cast.hash) }}
      className="mb-2 rounded-lg border dark:border-gray-800 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:cursor-pointer"
    >
      <div className="flex flex-row items-center gap-x-1 mb-0.5 min-w-0">
        <Avatar className="h-4 w-4 shrink-0">
          <AvatarImage src={cast.author.pfp_url} alt="" />
          <AvatarFallback>
            <Skeleton className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{cast.author.display_name}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 truncate">@{cast.author.username}</span>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 break-words">
        <CastText text={cast.text} />
      </div>
    </div>
  )
}
