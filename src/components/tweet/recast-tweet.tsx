import { type EnrichedTweet } from 'react-tweet'
import { nFormatter } from './utils'
import { TweetHeader } from './tweet-header'
import { TweetMedia } from './tweet-media'
import { HeartIcon, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { getTimeSinceTimestamp } from '@/utils/textUtils'
import TweetText from './TweetText'
import { Skeleton } from '../ui/skeleton'

export const RecastTweet = ({
  tweet,
}: {
  tweet: EnrichedTweet
}) => {
  return (
    <>
      {!!tweet ?
        <Link
          href={`https://x.com/${tweet.user.screen_name}/status/${tweet.id_str}`}
          target='_blank'
          className='max-w-[280px] xs:max-w-[310px] sm:max-w-none'
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <div className='pt-2 px-4 border border-gray-200 dark:border-gray-700 rounded-xl sm:hover:bg-gray-100 sm:dark:hover:bg-gray-800 flex flex-col hover:cursor-pointer'>
              <div className="flex flex-col">
                <div className="flex flex-row text-sm mb-1 items-center justify-between w-full overflow-hidden">
                  <div className='flex flex-row items-center'>
                    <img src={tweet.user.profile_image_url_https} className='h-4 w-4 mr-1 rounded-full'></img>
                    <Link href={`https://x.com/${tweet.user.screen_name}`} className='font-medium mr-0.5 hover:underline dark:text-gray-100 max-w-[100px] xs:max-w-[115px] sm:max-w-[280px] truncate'>{tweet.user.name}</Link>
                    {tweet.user.verified || tweet.user.is_blue_verified ? (
                      <svg
                        aria-label="Verified Account"
                        className="inline h-4 w-4 text-blue-500 mr-1"
                        viewBox="0 0 24 24"
                      >
                        <g fill="currentColor">
                          <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                        </g>
                      </svg>
                    ) : null}
                    <Link href={`https://x.com/${tweet.user.screen_name}`} className='text-gray-500 dark:text-gray-400 hover:underline max-w-[90px] xs:max-w-[105px] sm:max-w-[200px] truncate'>@{tweet.user.screen_name}</Link>
                    <span className='text-gray-500 dark:text-gray-400 ml-1'>·</span>
                    <span className='text-gray-500 dark:text-gray-400 ml-1'>{getTimeSinceTimestamp(new Date(tweet.created_at).getTime(), true)}</span>
                  </div>
                  <a
                    href={tweet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View on Twitter"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className='w-4 h-4 fill-current text-black dark:text-white'>
                      <g>
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                      </g>
                    </svg>
                  </a>
                </div>
                <div className=''>
                  <p className="text-sm text-gray-900 mb-2 dark:text-gray-100 max-w-[260px] sm:max-w-none break-words">
                    <TweetText text={tweet.text} />
                  </p>
                </div>
                <div className="mb-2 mt-3">
                  {tweet.mediaDetails?.length ? (
                    <div
                      className={
                        tweet.mediaDetails.length === 1
                          ? ''
                          : 'inline-grid grid-cols-2 gap-x-2 gap-y-2'
                      }
                    >
                      {tweet.mediaDetails?.map((media) => (
                        <a key={media.media_url_https} href={tweet.url} target="_blank">
                          <TweetMedia tweet={tweet} media={media} />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div >
        </Link>
        :
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
      }
    </>
  );

}