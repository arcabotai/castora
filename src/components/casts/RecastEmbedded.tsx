import axios from 'axios';

import { HOST_URL } from '@/utils/hostURL';
import Link from 'next/link';
import { useState, useEffect } from 'react'
import { getTimeSinceTimestamp, getProcessedCastContent, parentURLToChannelName, parentURLToChannelId, truncateLongWord } from '@/utils/textUtils';

import { useSelectedCast } from '@/providers/SelectedCastProvider';
import URLPreviewCard from './URLPreview';
import CastText from './CastText';
import ProfileHoverCard from '../profile/ProfileHoverCard';
import PowerBadge from '../PowerBadge';
import { useQuery } from 'react-query';
import { Skeleton } from '../ui/skeleton';
import { isMobile } from 'react-device-detect';
import CastoraBadge from '../CastoraBadge';
import { useSupercastMember } from '@/providers/SupercastMemberProvider'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import CastEmbeds from './CastEmbeds';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

type CastEmbedded = {
  hash: string
  parent_url: string
  text: string
  timestamp: string
  author: {
    fid: number
    username: string
    display_name: string
    pfp_url: string
  }
  embeds: any[]
}


export default function RecastEmbedded({ cast, isColumn }: { cast: CastEmbedded, isColumn?: boolean }) {

  const { isSupercastMember } = useSupercastMember();
  const { supercastUserState } = useSupercastUserState();
  const { navigateToCast } = useSelectedCast()

  return (
    <>
      {cast ?
        <div
          className='max-w-full'
          onClick={(e) => navigateToCast(e, cast.hash)}
        >
          <div className='pt-2 px-4 border border-gray-200 dark:border-gray-700 rounded-xl sm:hover:bg-gray-100 sm:dark:hover:bg-gray-800 flex flex-col hover:cursor-pointer'>
            <div className="flex flex-col min-w-0">
              <div className="flex flex-row text-sm mb-1 items-center min-w-0 overflow-hidden">
                <div className='flex-shrink-0'>
                  <Avatar className='h-4 w-4 mr-1'>
                    <AvatarImage
                      src={cast.author.pfp_url}
                      alt='Profile picture'
                    />
                    <AvatarFallback>
                      <Skeleton
                        className="h-4 w-4"
                      />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <Link href={`/${cast.author.username}`} className='font-semibold mr-1 hover:underline dark:text-gray-100 min-w-0 max-w-full flex flex-row items-center gap-x-1'>
                  <span className={`truncate`}>{truncateLongWord(cast.author.display_name ? cast.author.display_name : "", 15)}</span>
                  {/* {cast.author.powerBadge && <PowerBadge />} */}
                  {isSupercastMember(cast.author.fid) && <CastoraBadge />}
                </Link>
                <Link href={`/${cast.author.username}`} className='text-gray-500 dark:text-gray-400 hover:underline truncate'>@{cast.author.username}</Link>
                <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>·</span>
                <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>{getTimeSinceTimestamp(cast.timestamp, true)}</span>
              </div>
              <div className=''>
                <p className="text-sm text-gray-900 mb-2 dark:text-gray-100 max-w-full break-words">
                  <CastText text={cast.text} />
                </p>
                <div className='mb-2'>
                  <CastEmbeds cast={cast} withQuotes={false} isColumn={isColumn} />
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
            </div>
          </div>
        </div>
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
