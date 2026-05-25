import { enrichTweet } from 'react-tweet'
import type { Tweet as ReactTweet } from 'react-tweet/api'
import axios from 'axios'

import { useQuery } from 'react-query'
import { RecastTweet } from './recast-tweet'
import { Skeleton } from '../ui/skeleton'
import { sanitizeTweetForReactTweet } from '../../utils/tweets'

export default function Tweet({ id }: { id: string }) {

  const { data: tweet } = useQuery(['tweet', id], async () => {
    const { data } = await axios.get(`/api/tweet?id=${id}`)
    return data.tweet
  })


  if (!tweet) {
    return (
      <div className='pt-2 px-4 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col'>
        <div className="flex flex-row text-sm mb-3 items-center">
          <div className='flex-shrink-0'>
            <Skeleton className='h-6 w-6 mr-2 rounded-full' />
          </div>
          <div className='flex flex-row items-center'>
            <Skeleton className='h-4 w-36' />
          </div>
        </div>
        <div className=''>
          <Skeleton className='h-20 mb-2' />
          <Skeleton className='h-6 mb-2' />
        </div>
      </div>
    )
  }

  if (!tweet.user) {
    return null
  }

  try {
    return <RecastTweet tweet={enrichTweet(sanitizeTweetForReactTweet(tweet as ReactTweet))} />
  } catch (error) {
    console.warn('Skipping malformed tweet embed', { id, error })
    return null
  }
}
