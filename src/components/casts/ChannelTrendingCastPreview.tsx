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
import CastEmbeds from './CastEmbeds';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';

export default function ChannelTrendingCastPreview({ cast }: { cast: any }) {

  const { supercastUserState } = useSupercastUserState()

  const [reactionStatus, setReactionStatus] = useState(!!supercastUserState.currentFid ? cast.viewer_context.liked : false)
  const [recastStatus, setRecastStatus] = useState(!!supercastUserState.currentFid ? cast.viewer_context.recasted : false)
  const [bookmarkStatus, setBookmarkStatus] = useState(false)
  const [reactionCount, setReactionCount] = useState(cast.reactions.likes_count)
  const [recastCount, setRecastCount] = useState(cast.reactions.recasts_count)
  const [bookmarkCount, setBookmarkCount] = useState(0)

  return (
    <Link href={`/c/${cast.hash}`}>
      <div className='pt-2 px-4 border border-gray-200 dark:border-gray-700 rounded-xl sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800 flex flex-col hover:cursor-pointer'>
        <div className="flex flex-col">
          <div className="flex flex-row text-sm mb-1 items-center">
            <div className='flex-shrink-0'>
              <ProfileHoverCard
                fid={cast.author.fid}
                avatar={cast.author.pfp_url}
                username={cast.author.username}
                displayName={cast.author.display_name}
                bio={cast.author.profile.bio.text}
                followingCount={cast.author.following_count}
                followerCount={cast.author.follower_count}
                powerBadge={cast.author.power_badge}
              >
                <img src={cast.author.pfp_url} className='h-4 w-4 mr-1 rounded-full'></img>
              </ProfileHoverCard>
            </div>
            <ProfileHoverCard
              fid={cast.author.fid}
              avatar={cast.author.pfp_url}
              username={cast.author.username}
              displayName={cast.author.display_name}
              bio={cast.author.profile.bio.text}
              followingCount={cast.author.following_count}
              followerCount={cast.author.follower_count}
              powerBadge={cast.author.power_badge}
            >
              <div className='font-semibold mr-1 hover:underline dark:text-gray-100 min-w-0 max-w-[100px] xs:max-w-[115px] sm:max-w-[280px] flex flex-row items-center'>
                <span className={`${cast.author.power_badge && "mr-1"} truncate`}>{cast.author.display_name}</span> {cast.author.power_badge && <PowerBadge />}
              </div>
            </ProfileHoverCard>
            <div className='truncate'>
              <ProfileHoverCard
                fid={cast.author.fid}
                avatar={cast.author.pfp_url}
                username={cast.author.username}
                displayName={cast.author.display_name}
                bio={cast.author.profile.bio.text}
                followingCount={cast.author.following_count}
                followerCount={cast.author.follower_count}
                powerBadge={cast.author.power_badge}
              >
                <div className='text-gray-500 dark:text-gray-400 hover:underline max-w-[90px] xs:max-w-[105px] sm:max-w-[200px] truncate'>@{cast.author.username}</div>
              </ProfileHoverCard>
            </div>
            <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>·</span>
            <span className='text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0'>{getTimeSinceTimestamp(cast.timestamp, true)}</span>
          </div>
          <p className="text-sm text-gray-900 mb-2 dark:text-gray-100 max-w-full break-words">
            <CastText text={cast.text} maxWords={40} maxLines={3} />
          </p>
          {!!parentURLToChannelName(cast.parent_url) &&
            <div className='flex items-center border rounded-md text-xs max-w-fit px-1 py-0.5 mb-1 dark:border-gray-700'>
              <div
                onClick={(e) => e.stopPropagation()}
                className='text-gray-500 dark:text-gray-400 hover:underline'>{`/${parentURLToChannelName(cast.parent_url)}`}
              </div>
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
    </Link>
  );
}
