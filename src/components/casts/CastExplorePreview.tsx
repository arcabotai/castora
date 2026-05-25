import axios from 'axios';

import { HOST_URL } from '@/utils/hostURL';
import Link from 'next/link';
import { useState, useEffect } from 'react'
import { getTimeSinceTimestamp, getProcessedCastContent, parentURLToChannelName, parentURLToChannelId } from '@/utils/textUtils';

import { useSelectedCast } from '@/providers/SelectedCastProvider';
import URLPreviewCard from './URLPreview';
import CastText from './CastText';
import ProfileHoverCard from '../profile/ProfileHoverCard';
import PowerBadge from '../PowerBadge';
import { useQuery } from 'react-query';
import { Skeleton } from '../ui/skeleton';
import { isMobile } from 'react-device-detect';
import ReactionBar from './ReactionBar';
import { Cast } from '@/types';
import Recast from './Recast';
import FarcasterFrame from './FarcasterFrame';
import SupercastBadge from '../SupercastBadge';
import { useSupercastMember } from '@/providers/SupercastMemberProvider'
import CastEmbeds from './CastEmbeds';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';

export default function CastExplorePreview({ cast }: { cast: any }) {

  const { navigateToCast } = useSelectedCast()
  const { isSupercastMember } = useSupercastMember();
  const { supercastUserState } = useSupercastUserState()

  const [reactionStatus, setReactionStatus] = useState(!!supercastUserState.currentFid ? cast.viewer_context.liked : false)
  const [recastStatus, setRecastStatus] = useState(!!supercastUserState.currentFid ? cast.viewer_context.recasted : false)
  const [bookmarkStatus, setBookmarkStatus] = useState(false)
  const [reactionCount, setReactionCount] = useState(cast.reactions.likes_count)
  const [recastCount, setRecastCount] = useState(cast.reactions.recasts_count)
  const [bookmarkCount, setBookmarkCount] = useState(0)

  return (
    <div
      onClick={(e) => navigateToCast(e, cast.hash)}
      className='w-full'
    >
      <div className='pt-2 px-4 border border-gray-200 dark:border-gray-700 rounded-xl sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800 flex flex-col hover:cursor-pointer'>
        <div className="flex flex-col min-w-0">
          <div className="flex flex-row text-sm mb-1 items-center min-w-0 overflow-hidden">
            <div className='flex-shrink-0'>
              <img src={cast.author.pfp_url} className='h-4 w-4 mr-1 rounded-full'></img>
            </div>
            <Link href={`/${cast.author.username}`} className='font-semibold mr-1 hover:underline dark:text-gray-100 min-w-0 max-w-[100px] xs:max-w-[115px] sm:max-w-[280px] flex flex-row gap-x-1 items-center'>
              <span className={`truncate`}>{cast.author.display_name}</span>
              {cast.author.power_badge && <PowerBadge />}
              {isSupercastMember(cast.author.fid) && <SupercastBadge />}
            </Link>
            <div className='truncate'>
              <Link href={`/${cast.author.username}`} className='text-gray-500 dark:text-gray-400 hover:underline max-w-[90px] xs:max-w-[105px] sm:max-w-[200px] truncate'>@{cast.author.username}</Link>
            </div>
            <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>·</span>
            <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>{getTimeSinceTimestamp(cast.timestamp, true)}</span>
          </div>
          <p className="text-sm text-gray-900 mb-2 dark:text-gray-100 max-w-full break-words">
            <CastText text={cast.text} />
          </p>
          {cast.embeds.length > 0 &&
            <div className='mb-2'>
              <CastEmbeds cast={cast} />
            </div>
          }
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
            castHash={cast.hash}
            authorFid={cast.author.fid}
            replyCount={cast.replies.count}
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
    </div>
  );
}
