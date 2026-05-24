import { useQuery } from 'react-query'
import axios from 'axios'
import { HOST_URL } from '@/utils/hostURL'
import { usePrivy } from '@privy-io/react-auth'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { formatNumber } from '@/utils/textUtils'
import { Skeleton } from './ui/skeleton'
import MoxieLogo from './assets/MoxieLogo'

const MOXIE_LIKE_MULTIPLIER = 0.5
const MOXIE_RECAST_MULTIPLIER = 2
const MOXIE_REPLY_MULTIPLIER = 1
const MOXIE_QUOTECAST_MULTIPLIER = 2

export function MoxieScoreAccordion() {
  const { ready, authenticated, getAccessToken } = usePrivy()
  const { supercastUserState } = useSupercastUserState()

  const fetchMoxieScore = async () => {
    const accessToken = await getAccessToken()
    const response = await axios.get(`${HOST_URL}/api/moxie-score?userId=${supercastUserState.currentFid}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })

    return response.data
  }

  const { data: moxieScore, isLoading, error } = useQuery(
    ['moxieScore', supercastUserState.currentFid],
    fetchMoxieScore,
    {
      enabled: !!supercastUserState.currentFid && ready && authenticated,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  if (error) {
    return <p className="text-red-500 text-sm">Failed to load Moxie score.</p>
  }

  return (
    <Accordion type="single" collapsible className="w-full py-0">
      <AccordionItem value="moxie-score" className="border-0">
        <AccordionTrigger className="text-sm font-base py-1 hover:no-underline">
          <div className="flex flex-row items-center justify-between w-full">
            <span className="font-base">Far Score</span>
            {isLoading ? (
              <Skeleton className='w-16 h-5' />
            ) : (
              <span className="font-semibold">
                {formatNumber(moxieScore?.farcasterScore.farScore)}
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2 text-sm pt-2">
            <li className="flex justify-between">
              <span className="text-gray-500">Your like is worth:</span>
              <div className="flex flex-row items-center gap-x-1">
                <MoxieLogo width={4} height={4} />
                <span className="font-semibold">{formatNumber(MOXIE_LIKE_MULTIPLIER * moxieScore?.farcasterScore.farScore)}</span>
              </div>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Your recast is worth:</span>
              <div className="flex flex-row items-center gap-x-1">
                <MoxieLogo width={4} height={4} />
                <span className="font-semibold">{formatNumber(MOXIE_RECAST_MULTIPLIER * moxieScore?.farcasterScore.farScore)}</span>
              </div>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Your reply is worth:</span>
              <div className="flex flex-row items-center gap-x-1">
                <MoxieLogo width={4} height={4} />
                <span className="font-semibold">{formatNumber(MOXIE_REPLY_MULTIPLIER * moxieScore?.farcasterScore.farScore)}</span>
              </div>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Your quotecast is worth:</span>
              <div className="flex flex-row items-center gap-x-1">
                <MoxieLogo width={4} height={4} />
                <span className="font-semibold">{formatNumber(MOXIE_QUOTECAST_MULTIPLIER * moxieScore?.farcasterScore.farScore)}</span>
              </div>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Your Far Rank:</span>
              <span className="font-semibold">#{formatNumber(moxieScore?.farcasterScore.farRank)}</span>
            </li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}