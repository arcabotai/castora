'use client'
import { useInfiniteQuery, useQuery } from 'react-query'
import axios from 'axios'
import Link from 'next/link'
import { HOST_URL } from '@/utils/hostURL'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'

export default function ActiveChannelsColumn() {

  const { supercastUserState, isRegularUser } = useSupercastUserState()

  const { getAccessToken } = usePrivy()

  const fetchActiveChannels = async ({ pageParam = '' }) => {

    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/channels/user-channels?cursor=${pageParam}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
    return response.data
  }

  const followedChannelsQuery = useInfiniteQuery(
    ['activeChannels', supercastUserState?.currentFid],
    fetchActiveChannels,
    {
      getNextPageParam: (lastPage) => lastPage.cursor || undefined,
      enabled: isRegularUser(),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      cacheTime: 24 * 60 * 60 * 1000, // 24 hours
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
    })


  return (
    <>
      {(followedChannelsQuery.isSuccess && followedChannelsQuery.data.pages[0]?.channels?.length > 0) && (
        <div className='flex flex-col pt-2 border-t dark:border-t-gray-800'>
          {followedChannelsQuery.data.pages.map((page, i) => (
            page.channels.slice(0, 6).map((channel: any) => (
              <Link
                href={`/channel/${channel.id}`}
                key={channel.id}
                className={`px-[10px] py-2 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-100 font-medium group flex gap-x-2 items-center rounded-md text-sm transition-transform duration-200 active:scale-95 ease-in-out`}
              >
                <img src={channel.image_url} className="inline-block h-5 w-5 rounded-full bg-gray-100 object-cover"></img>
                <p className="text-gray-500 dark:text-gray-100 text-sm truncate">{channel.id}</p>
              </Link>
            ))
          ))}
        </div>
      )}
    </>
  )
}
