import { enrichTweet } from 'react-tweet'
import type { Tweet as ReactTweet } from 'react-tweet/api'
import axios from 'axios'
import { Component, ReactNode, useMemo } from 'react'

import { useQuery } from 'react-query'
import { RecastTweet } from './recast-tweet'
import { Skeleton } from '../ui/skeleton'
import { sanitizeTweetForReactTweet } from '../../utils/tweets'

class TweetEmbedErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; tweetId: string },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('Skipping malformed tweet embed', { id: this.props.tweetId, error })
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

function TweetFallback({ id }: { id: string }) {
  return (
    <a
      href={`https://x.com/i/web/status/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="block rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      View this post on X
    </a>
  )
}

export default function Tweet({ id }: { id: string }) {

  const { data: tweet, isError } = useQuery(['tweet', id], async () => {
    const { data } = await axios.get(`/api/tweet?id=${id}`)
    return data.tweet
  }, {
    retry: 1,
  })

  const enrichedTweet = useMemo(() => {
    if (!tweet?.user) {
      return null
    }

    try {
      return enrichTweet(sanitizeTweetForReactTweet(tweet as ReactTweet))
    } catch (error) {
      console.warn('Skipping malformed tweet embed', { id, error })
      return null
    }
  }, [id, tweet])


  if (isError) {
    return <TweetFallback id={id} />
  }

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

  if (!enrichedTweet) {
    return <TweetFallback id={id} />
  }

  return (
    <TweetEmbedErrorBoundary tweetId={id} fallback={<TweetFallback id={id} />}>
      <RecastTweet tweet={enrichedTweet} />
    </TweetEmbedErrorBoundary>
  )
}
