
import Link from 'next/link';
import { useState } from 'react'
import { getTimeSinceTimestamp } from '@/utils/textUtils';

import { useSelectedCast } from '@/providers/SelectedCastProvider';
import CastText from './CastText';
import ProfileHoverCard from '../profile/ProfileHoverCard';
import PowerBadge from '../PowerBadge';
import ReactionBar from './ReactionBar';
import SupercastBadge from '../SupercastBadge';
import { useSupercastMember } from '@/providers/SupercastMemberProvider'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';

export default function BookmarkExplorePreview({ cast }: { cast: any }) {

  const { navigateToCast } = useSelectedCast()
  const { isSupercastMember } = useSupercastMember();
  const { supercastUserState } = useSupercastUserState()

  const [reactionStatus, setReactionStatus] = useState(!!supercastUserState.currentFid ? cast.viewer_context.liked : false)
  const [recastStatus, setRecastStatus] = useState(!!supercastUserState.currentFid ? cast.viewer_context.recasted : false)
  const [bookmarkStatus, setBookmarkStatus] = useState(true)
  const [reactionCount, setReactionCount] = useState(cast.reactions.likes_count)
  const [recastCount, setRecastCount] = useState(cast.reactions.recasts_count)
  const [bookmarkCount, setBookmarkCount] = useState(0)

  return (
    <div
      onClick={(e) => navigateToCast(e, cast.hash)}
      className='w-full'
    >
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
              <Link href={`/${cast.author.username}`} className='font-semibold mr-1 hover:underline dark:text-gray-100 max-w-[100px] xs:max-w-[115px] sm:max-w-[280px] flex flex-row gap-x-1 items-center'>
                <span className={`truncate`}>{cast.author.display_name}</span>
                {cast.author.power_badge && <PowerBadge />}
                {isSupercastMember(cast.author.fid) && <SupercastBadge />}
              </Link>
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
                <Link href={`/${cast.author.username}`} className='text-gray-500 dark:text-gray-400 hover:underline max-w-[90px] xs:max-w-[105px] sm:max-w-[200px] truncate'>@{cast.author.username}</Link>
              </ProfileHoverCard>
            </div>
            <span className='text-gray-500 dark:text-gray-400 ml-1'>·</span>
            <span className='text-gray-500 dark:text-gray-400 ml-1'>{getTimeSinceTimestamp(cast.timestamp, true)}</span>
          </div>
          <div className=''>
            <p className="text-sm text-gray-900 mb-2 dark:text-gray-100 max-w-[260px] sm:max-w-none break-words">
              <CastText text={cast.text} maxWords={20} firstLineOnly={true} />
            </p>
          </div>
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
