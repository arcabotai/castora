'use client'
import { UsersIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { formatNumber, truncateLongWord } from '@/utils/textUtils'
import { Channel } from '@/types'

interface ChannelExplorePreviewProps {
  channel: Channel,
  cast_count_1d?: number
}

export default function ChannelExplorePreview(props: ChannelExplorePreviewProps) {

  const { channel, cast_count_1d } = props

  return (
    <Link
      href={`/channel/${channel.id}`}
      key={channel.id}
      className={`h-[100px] flex flex-row gap-x-3 py-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none dark:border-gray-700 hover:cursor-pointer rounded-xl border`}
    >
      <img src={channel.image_url} className="inline-block h-10 w-10 rounded-full bg-gray-100 object-cover border dark:border-gray-700 shrink-0"></img>
      <div className='flex flex-col flex-grow'>
        <div className='flex flex-row items-center space-x-2'>
          <div className="min-w-0 flex-1 flex flex-row items-center justify-between">
            <div className="flex flex-row items-center">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mr-1">{channel.id}</div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex flex-row items-center gap-x-1">{formatNumber(channel.follower_count)}
              <UsersIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 flex-grow">
          {truncateLongWord(channel.description, 70)}
        </p>
        {!!cast_count_1d &&
          <p className=''>
            <span className="text-xs text-gray-500 dark:text-gray-400">{formatNumber(cast_count_1d)}</span>
            {' '}
            <span className="text-xs text-gray-500 dark:text-gray-400">casts in last 24 hours</span>
          </p>
        }
      </div>
    </Link>

  )
}
