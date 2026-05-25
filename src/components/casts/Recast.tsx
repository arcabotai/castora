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
import SupercastBadge from '../SupercastBadge';
import { useSupercastMember } from '@/providers/SupercastMemberProvider'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import CastEmbeds from './CastEmbeds';

export default function Recast({ hash, isColumn }: { hash: string, isColumn?: boolean }) {

  const { isSupercastMember } = useSupercastMember();
  const { supercastUserState } = useSupercastUserState();
  const { navigateToCast } = useSelectedCast()

  const fetchCast = async () => {
    const response = await axios.get(`${HOST_URL}/api/cast/single?hash=${hash}`, {
      headers: {
        'asFid': supercastUserState.currentFid
      }
    })
    return response.data.currentCast
  }

  const castQuery = useQuery(
    ['cast', hash],
    fetchCast, {
    enabled: !!hash
  })

  return (
    <>
      {castQuery.isSuccess ?
        <div
          className='max-w-full'
          onClick={(e) => navigateToCast(e, castQuery.data.hash)}
        >
          <div className='pt-2 px-4 border border-gray-200 dark:border-gray-700 rounded-xl sm:hover:bg-gray-100 sm:dark:hover:bg-gray-800 flex flex-col hover:cursor-pointer'>
            <div className="flex flex-col min-w-0">
              <div className="flex flex-row text-sm mb-1 items-center min-w-0 overflow-hidden">
                <div className='flex-shrink-0'>
                  <ProfileHoverCard
                    fid={castQuery.data.author.fid}
                    avatar={castQuery.data.author.pfp_url}
                    username={castQuery.data.author.username}
                    displayName={castQuery.data.author.display_name}
                    bio={castQuery.data.author.profile.bio.text}
                    followingCount={castQuery.data.author.following_count}
                    followerCount={castQuery.data.author.follower_count}
                    powerBadge={castQuery.data.author.power_badge}
                  >
                    <img src={castQuery.data.author.pfp_url} className='h-4 w-4 mr-1 rounded-full'></img>
                  </ProfileHoverCard>
                </div>
                <ProfileHoverCard
                  fid={castQuery.data.author.fid}
                  avatar={castQuery.data.author.pfp_url}
                  username={castQuery.data.author.username}
                  displayName={castQuery.data.author.display_name}
                  bio={castQuery.data.author.profile.bio.text}
                  followingCount={castQuery.data.author.following_count}
                  followerCount={castQuery.data.author.follower_count}
                  powerBadge={castQuery.data.author.power_badge}
                >
                  <Link href={`/${castQuery.data.author.username}`} className='font-semibold mr-1 hover:underline dark:text-gray-100 min-w-0 max-w-[100px] xs:max-w-[115px] sm:max-w-[280px] flex flex-row items-center gap-x-1'>
                    <span className={`truncate`}>{truncateLongWord(castQuery.data.author.display_name ? castQuery.data.author.display_name : "", 15)}</span>
                    {castQuery.data.author.power_badge && <PowerBadge />}
                    {isSupercastMember(castQuery.data.author.fid) && <SupercastBadge />}
                  </Link>
                </ProfileHoverCard>
                <ProfileHoverCard
                  fid={castQuery.data.author.fid}
                  avatar={castQuery.data.author.pfp_url}
                  username={castQuery.data.author.username}
                  displayName={castQuery.data.author.display_name}
                  bio={castQuery.data.author.profile.bio.text}
                  followingCount={castQuery.data.author.following_count}
                  followerCount={castQuery.data.author.follower_count}
                  powerBadge={castQuery.data.author.power_badge}
                >
                  <Link href={`/${castQuery.data.author.username}`} className='text-gray-500 dark:text-gray-400 hover:underline truncate'>@{castQuery.data.author.username}</Link>
                </ProfileHoverCard>
                <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>·</span>
                <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>{getTimeSinceTimestamp(castQuery.data.timestamp, true)}</span>
              </div>
              <div className=''>
                <p className="text-sm text-gray-900 mb-2 dark:text-gray-100 max-w-full break-words">
                  <CastText text={castQuery.data.text} />
                </p>
                <div className='mb-2'>
                  <CastEmbeds cast={castQuery.data} withQuotes={false} isColumn={isColumn} />
                </div>
              </div>
              {!!parentURLToChannelName(castQuery.data.parent_url) &&
                <div className='flex items-center border rounded-md text-xs max-w-fit px-1 py-0.5 mb-1 dark:border-gray-700'>
                  <Link
                    onClick={(e) => e.stopPropagation()}
                    href={`/channel/${parentURLToChannelId(castQuery.data.parent_url)}`}
                    className='text-gray-500 dark:text-gray-400 hover:underline'>{`/${parentURLToChannelName(castQuery.data.parent_url)}`}
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
