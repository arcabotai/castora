import { useQuery } from 'react-query'
import axios from 'axios'
import { HOST_URL } from '@/utils/hostURL'
import { usePrivy } from '@privy-io/react-auth'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import Spinner from '../Spinner'
import { formatNumber } from '@/utils/textUtils'
import { isMobile } from 'react-device-detect'
import { DrawerClose, DrawerFooter } from '../ui/drawer'
import { Button } from '../ui/button'
import MoxieLogo from '../assets/MoxieLogo'
import { Skeleton } from '../ui/skeleton'

interface MoxieStatsContentProps {
  castHash: string
  setOpen: (open: boolean) => void
}

const earnerTypeToText = (earnerType: string) => {
  switch (earnerType) {
    case 'NETWORK':
      return 'Farcaster network'
    case 'USER_UNSPLIT':
      return 'Cast author'
    case 'CREATOR':
      return 'Cast author'
    case 'CHANNEL_FANS':
      return 'Channel fan holders'
    case 'CREATOR_FANS':
      return 'Author fan holders'
  }
}

export function MoxieStatsContent({ castHash, setOpen }: MoxieStatsContentProps) {
  const { getAccessToken } = usePrivy()
  const { supercastUserState } = useSupercastUserState()

  const fetchMoxieStats = async () => {
    const accessToken = await getAccessToken()
    try {
      const response = await axios.get(`${HOST_URL}/api/moxie-cast-stats?castHash=${castHash}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'asFid': supercastUserState.currentFid,
        }
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  }

  const { data: moxieStats, isLoading, error } = useQuery(
    ['moxieStats', castHash, supercastUserState.currentFid],
    fetchMoxieStats,
    {
      enabled: !!castHash && !!supercastUserState.currentFid,
      staleTime: 10 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  )

  if (isLoading) {
    return (
      <div className="space-y-3 pt-4 px-4 sm:p-0">
        <h3 className="text-lg font-semibold text-center">Moxie earnings for this cast</h3>
        <div className='flex flex-row items-center gap-x-2 px-4'>
          <Skeleton className="h-5 w-full" />
        </div>
        <div className='px-4'>
          <h4 className="font-medium mb-2">Earnings Split:</h4>
          <ul className="flex flex-col gap-y-1">
            {[...Array(4)].map((_, index) => (
              <li key={index} className="flex justify-between items-center">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-1/5" />
              </li>
            ))}
          </ul>
        </div>
        {isMobile && (
          <DrawerFooter>
            <DrawerClose>
              <Button variant='secondary' className='w-full'>Close</Button>
            </DrawerClose>
          </DrawerFooter>
        )}
      </div>
    )
  }

  if (error) {
    return <p className="text-center text-red-500">Failed to load Moxie stats.</p>
  }

  if (!moxieStats) {
    return <p className="text-center">This cast didn't earn any moxie yet. Check back later.</p>
  }

  return (
    <div className="space-y-3 pt-4 px-4 sm:p-0">
      <h3 className="text-lg font-semibold text-center">Moxie earnings for this cast</h3>
      <div className='flex flex-row items-center gap-x-2 px-4'>
        <p className='text-sm text-gray-500'>This cast earned <span className='font-semibold text-black dark:text-white'>{formatNumber(moxieStats?.castValue?.formattedValue)}</span> Moxie</p>
      </div>
      <div className='px-4'>
        <h4 className="font-medium mb-2">Earnings Split:</h4>
        <ul className="flex flex-col gap-y-1">
          {moxieStats.moxieEarningsSplit?.sort((a, b) => b.earningsAmount - a.earningsAmount).map((split, index) => (
            <li key={index} className="flex justify-between items-center">
              <span className='text-sm text-gray-500'>{earnerTypeToText(split.earnerType)}</span>
              <span className="flex items-center gap-x-2">
                <MoxieLogo width={4} height={4} />
                <span className='font-semibold'>{formatNumber(split.earningsAmount)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      {isMobile && (
        <DrawerFooter>
          <DrawerClose>
            <Button variant='secondary' className='w-full'>Close</Button>
          </DrawerClose>
        </DrawerFooter>
      )}
    </div>
  )
}