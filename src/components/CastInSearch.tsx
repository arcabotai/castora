'use client'

import { useState } from 'react'
import Link from 'next/link'
import axios from 'axios'

import Recast from './casts/Recast'
import URLPreviewCard from './casts/URLPreview'
import { truncateLongWord, getTimeSinceTimestamp, getProcessedCastContent, parentURLToChannelName, parentURLToChannelId } from '@/utils/textUtils'
import ReactionBar from './casts/ReactionBar'

import { isMobile } from 'react-device-detect'
import Image from 'next/image'
import CastText from './casts/CastText'

export default function CastInSearch({ cast }: { cast: any }) {

  const [reactionStatus, setReactionStatus] = useState(cast.reactionStatus)
  const [recastStatus, setRecastStatus] = useState(cast.recastStatus)
  const [bookmarkStatus, setBookmarkStatus] = useState(cast.bookmarkStatus)
  const [reactionCount, setReactionCount] = useState(cast.meta.reactions.count)
  const [recastCount, setRecastCount] = useState(cast.meta.recasts.count)
  const [bookmarkCount, setBookmarkCount] = useState(cast.bookmarkCount)

  return (
    <div className="flex flex-row">
      <div className="mr-2 flex-shrink-0">
        {!!cast.meta.avatar
          ?
          <Link
            onClick={(e) => e.stopPropagation()}
            href={`/${cast.body.username}`}
          >
            <Image
              width={40}
              height={40}
              alt='Profile picture'
              src={cast.meta.avatar} className="inline-block h-10 w-10 overflow-hidden object-cover rounded-full bg-gray-100"
            />
          </Link>
          :
          <span className="inline-block h-10 w-10 overflow-hidden rounded-full bg-gray-100">
            <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
        }
      </div>
      <div className="flex flex-col">
        <div className="flex flex-row text-sm mb-1 items-center">
          <Link onClick={(e) => e.stopPropagation()} href={`/${cast.body.username}`} className='font-semibold mr-1 hover:underline dark:text-gray-100 truncate'>{cast.meta.displayName}</Link>
          <Link onClick={(e) => e.stopPropagation()} href={`/${cast.body.username}`} className='text-gray-500 dark:text-gray-400 hover:underline truncate'>@{cast.body.username}</Link>
          <span className='text-gray-500 dark:text-gray-400 ml-1'>·</span>
          <span className='text-gray-500 dark:text-gray-400 ml-1'>{getTimeSinceTimestamp(cast.body.publishedAt, isMobile)}</span>
        </div>
        <div className=''>
          <p className="text-sm text-gray-900 mb-2 dark:text-gray-100">
            <CastText text={cast.body.data.text} />
          </p>
          <div className='flex flex-col gap-y-2'>
            <div className='flex flex-col gap-y-1 mb-2'>
            </div>
          </div>
        </div>
        {!!parentURLToChannelName(cast.parent_url) &&
          <div className='flex items-center border rounded-md text-xs max-w-fit px-1 py-0.5 mb-1 dark:border-gray-700'>
            <Link
              onClick={(e) => e.stopPropagation()}
              href={`/channel/${parentURLToChannelId(cast.parent_url)}`}
              className='text-gray-500 dark:text-gray-400 hover:underline'>{`/${parentURLToChannelName(cast.parent_url)}`}
            </Link>
          </div>
        }
        <ReactionBar
          castHash={cast.merkleRoot}
          authorFid={cast.body.fid}
          replyCount={cast.meta.numReplyChildren}
          reactionStatus={reactionStatus}
          setReactionStatus={setReactionStatus}
          reactionCount={reactionCount}
          setReactionCount={setReactionCount}
          recastStatus={recastStatus}
          setRecastStatus={setRecastStatus}
          recastCount={recastCount}
          setRecastCount={setRecastCount}
          bookmarkStatus={bookmarkStatus}
          setBookmarkStatus={setBookmarkStatus}
          bookmarkCount={bookmarkCount}
          setBookmarkCount={setBookmarkCount}
        />
      </div>
    </div>
  )
}
