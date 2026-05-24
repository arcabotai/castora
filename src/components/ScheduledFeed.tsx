'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'

import { useMobileSidebar } from '@/providers/MobileSidebarProvider'

import { HOST_URL } from '@/utils/hostURL'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { getTimeSinceTimestamp, getProcessedCastContent, parentURLToChannelName } from '@/utils/textUtils'
import URLPreviewCard from './casts/URLPreview'
import { isMobile } from 'react-device-detect'
import { SCHEDULED_CAST_STATUS } from '@prisma/client'
import { toast } from 'sonner'
import CastText from './casts/CastText'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'

export default function ScheduledFeed() {

  const [casts, setCasts] = useState([])
  const [loadingScheduledCasts, setLoadingScheduledCasts] = useState(false)
  const { setOpenSidebar } = useMobileSidebar()

  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken, ready: readyPrivy } = usePrivy()

  const fetchScheduledCasts = async () => {
    setLoadingScheduledCasts(true)

    const accessToken = await getAccessToken()

    axios.get(`${HOST_URL}/api/cast/scheduled-casts?status=${SCHEDULED_CAST_STATUS.PENDING}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
      .then((response) => {
        setCasts(response.data.casts)
      })
      .catch((error) => {
        console.log(error)
      })
      .finally(() => {
        setLoadingScheduledCasts(false)
      })
  }

  const handleCancelScheduledCast = async (castID: string) => {

    const accessToken = await getAccessToken()

    axios.put(`${HOST_URL}/api/cast/scheduled-casts/${castID}`,
      {
        status: SCHEDULED_CAST_STATUS.CANCELLED
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'asFid': supercastUserState.currentFid,
        }
      })
      .then((response) => {
        const newCasts = casts.filter((cast) => cast.id !== castID)
        setCasts(newCasts)
        toast.success('Scheduled cast cancelled')
      })
      .catch((error) => {
        toast.error('Failed to cancel scheduled cast')
        console.log(error)
      })
  }

  useEffect(() => {
    if (readyPrivy) {
      fetchScheduledCasts()
    }
  }, [readyPrivy])

  return (
    <div>
      <div className='flex flex-row items-center py-2 px-4 sm:px-6 lg:px-8 border-b dark:border-gray-800'>
        <div className='flex flex-row items-center gap-x-6'>
          <button type="button" className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-200 lg:hidden" onClick={() => setOpenSidebar(true)}>
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <h2
            className="rounded-md text-black dark:text-gray-100 py-1.5 font-semibold text-sm"
          >
            Scheduled casts
          </h2>
        </div>
      </div>
      <div>
        {loadingScheduledCasts
          ?
          <div role="status" className='flex flex-row justify-center mx-auto mt-12'>
            <svg aria-hidden="true" className="w-6 h-6 mx-auto text-gray-200 animate-spin fill-gray-900" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
          :
          casts.length > 0
            ?
            <ul className=''>
              {casts.map((cast) => (
                <div
                  key={cast.id} className="px-4 sm:px-6 lg:px-8 py-3 sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800 border-b dark:border-gray-800"
                >
                  <div className="flex flex-row">
                    <div className="flex flex-col w-full">
                      <div className="flex flex-row text-sm mb-1 items-center justify-between w-full">
                        <div className='flex flex-row items-center'>
                          <span className='text-gray-500 dark:text-gray-400'>Scheduled for {new Date(cast.scheduledAt).toLocaleString()}</span>
                          {!!parentURLToChannelName(cast.parentURL) &&
                            <div className='flex items-center'>
                              <span className='text-gray-500 dark:text-gray-400 ml-1'>·</span>
                              <span className='text-gray-500 dark:text-gray-400 ml-1'>{`/${parentURLToChannelName(cast.parentURL)}`}</span>
                            </div>
                          }
                        </div>
                        <button
                          className='text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:underline'
                          onClick={() => handleCancelScheduledCast(cast.id)}
                        >
                          Cancel
                        </button>
                      </div>
                      <div className=''>
                        <p className="text-sm text-gray-900 mb-2 dark:text-gray-100">
                          <CastText text={cast.text} />
                        </p>
                        <div className='flex flex-col gap-y-2'>
                          <div className='flex flex-row gap-x-2'>
                            {cast.embedURLs.map((embed) => (
                              (embed.slice(-5) === '.jepg' || embed.slice(-4) === '.jpg' || embed.slice(-4) === '.png' || embed.slice(-4) === '.gif')
                              && <button key={embed}><img src={embed} className='shadow-sm rounded-md max-h-[250px] max-w-[250px]' /></button>
                            ))}
                          </div>
                          <div className='flex flex-col gap-y-1 mb-2'>
                            {cast.embedURLs.map((embed) => (
                              (!(embed.slice(-5) === '.jepg' || embed.slice(-4) === '.jpg' || embed.slice(-4) === '.png' || embed.slice(-4) === '.gif'))
                              && <URLPreviewCard key={embed} url={embed} small={isMobile} castHash={''} />
                            ))
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </ul>
            :
            <div className='flex flex-row justify-center py-3'>
              <span className='text-gray-500 text-sm'>You don't have any scheduled casts yet</span>
            </div>
        }
      </div>
    </div>
  )
}