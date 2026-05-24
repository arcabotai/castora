'use client'

import Link from 'next/link'

import Image from 'next/image'
import { useDeletedCast } from '@/providers/DeletedCastsProvider'
import CastText from '../casts/CastText'
import PowerBadge from '../PowerBadge'
import ProfileHoverCard from '../profile/ProfileHoverCard'
import { Draft, ScheduledReaction } from '@prisma/client'

export default function DraftPreviewScheduledReply({ reply, author, isLast }: { reply: ScheduledReaction, author: any, isLast: boolean }) {

  return (
    <>
      <div className="px-4 py-2 flex flex-row">
        <div className="mr-2 flex-shrink-0 flex flex-col items-center">
          {!!author.pfp_url
            ?
            <Link href={`/${author.username}`}>
              <ProfileHoverCard
                fid={author.fid}
                avatar={author.pfp_url}
                username={author.username}
                displayName={author.display_name}
                bio={author.profile.bio.text}
                followingCount={author.followingCount}
                followerCount={author.followerCount}
                powerBadge={author.powerBadge}
              >
                <Image
                  width={40}
                  height={40}
                  alt='Profile picture'
                  src={author.pfp_url} className="inline-block h-10 w-10 overflow-hidden object-cover rounded-full bg-gray-100"
                />
              </ProfileHoverCard>
            </Link>
            :
            <span className="inline-block h-10 w-10 overflow-hidden rounded-full bg-gray-100">
              <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
          }
          {!isLast &&
            <div className='flex-grow w-0.5 bg-gray-200 dark:bg-gray-800 mt-1 -mb-2'></div>
          }
        </div>
        <div className="flex flex-col flex-grow">
          <div className="flex flex-row text-sm mb-1 items-center justify-between max-w-[280px] xs:max-w-[310px] sm:max-w-none">
            <div className="flex flex-row text-sm mb-1">
              <ProfileHoverCard
                fid={author.fid}
                avatar={author.pfp_url}
                username={author.username}
                displayName={author.display_name}
                bio={author.profile.bio.text}
                followingCount={author.followingCount}
                followerCount={author.followerCount}
                powerBadge={author.powerBadge}
              >
                <Link href={`/${author.username}`} className='font-semibold mr-1 hover:underline dark:text-gray-100 flex flex-row items-center max-w-[130px] xs:max-w-[145px] sm:max-w-[280px]'>
                  <span className={`${author.powerBadge && "mr-1"} truncate`}>{author.display_name}</span> {author.powerBadge && <PowerBadge />}
                </Link>
              </ProfileHoverCard>
              <ProfileHoverCard
                fid={author.fid}
                avatar={author.pfp_url}
                username={author.username}
                displayName={author.display_name}
                bio={author.profile.bio.text}
                followingCount={author.followingCount}
                followerCount={author.followerCount}
                powerBadge={author.powerBadge}
              >
                <div className='max-w-[90px] xs:max-w-[105px] sm:max-w-[200px] truncate'>
                  <Link href={`/${author.username}`} className='text-gray-500 dark:text-gray-400 hover:underline truncate'>@{author.username}</Link>
                </div>
              </ProfileHoverCard>
            </div>
          </div>
          <div className='mb-2'>
            <p className="text-sm text-gray-900 dark:text-gray-100 mb-2 break-words">
              <CastText text={reply.text} />
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
