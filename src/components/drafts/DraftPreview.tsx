'use client'

import {
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'

import ReplyTextArea from '@/components/ReplyTextArea'
import Recast from '../casts/Recast'
import URLPreviewCard from '../casts/URLPreview'

import { getTimeSinceTimestamp, parentURLToChannelName, parentURLToChannelId } from '@/utils/textUtils'

import ReplyPreview from '../ReplyPreview'
import { Cast } from '@/types'
import { HOST_URL } from '@/utils/hostURL'
import AncestorCast from '../casts/AncestorCast'
import ReactionBar from '../casts/ReactionBar'
import { isMobile } from 'react-device-detect'
import Image from 'next/image'
import CastOptions from '../casts/CastOptions'
import { useDeletedCast } from '@/providers/DeletedCastsProvider'
import DeletedCast from '../casts/DeletedCast'
import ThreadChildCast from '../casts/ThreadChild'
import CastText from '../casts/CastText'
import { useQuery } from 'react-query'
import ProfileHoverCard from '../profile/ProfileHoverCard'
import PowerBadge from '../PowerBadge'
import FarcasterFrame from '../casts/FarcasterFrame'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { useLogin, usePrivy } from '@privy-io/react-auth'
import DraftPreviewReactionBar from './DraftPreviewReactionBar'
import Spinner from '../Spinner'
import DraftPreviewThreadChild from './DraftPreviewThreadChild'
import DraftPreviewReplyTextArea from './DraftPreviewReplyTextArea'
import DraftPreviewScheduledReply from './DraftPreviewScheduledReply'
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js'
import { PLAN } from '@prisma/client'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Skeleton } from '../ui/skeleton'


export default function DraftPreview({ draftId }: { draftId: string }) {

  // if castHash is not cast root, find the earlier replies and display them

  const [cast, setCast] = useState<Cast | null>(null)
  const [newReplies, setNewReplies] = useState([])

  const [reactionStatus, setReactionStatus] = useState(false)
  const [recastStatus, setRecastStatus] = useState(false)
  const [bookmarkStatus, setBookmarkStatus] = useState(false)
  const [reactionCount, setReactionCount] = useState(0)
  const [recastCount, setRecastCount] = useState(0)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [author, setAuthor] = useState<any>(null)

  const { deletedCastMap, setDeletedCastMap } = useDeletedCast()

  const { supercastUserState, setSuperCastUserState } = useSupercastUserState()

  const { ready: privyUserReady, authenticated, user, getAccessToken } = usePrivy();

  const router = useRouter();

  const onCompletedLogin = async (user, isNewUser, wasAlreadyAuthenticated) => {
    if (wasAlreadyAuthenticated) {
      return
    }

    const accessToken = await getAccessToken();

    await axios.post(`${HOST_URL}/api/user`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }).then((response) => {

      // get the fid from the user
      // if fid is null, show the account creation page
      // if fid is not null, show the main page

      const loggedInFid = response.data.user.fid

      readUserStateFromDatabase()
    }).catch((error) => {
      console.error(error)
      // wipe out the app if it fails here
      localStorage.clear()
    })
  }

  const { login } = useLogin({
    onComplete: onCompletedLogin,
    onError: (error) => {
      console.log(error);
      // Any logic you'd like to execute after a user exits the login flow or there is an error
    },
  });

  const posthogIdentify = (userFid, username) => {
    // identify the user in posthog, only 1 time per 24 hours
    if (!localStorage.getItem('posthogIdentifiedTime') || new Date().getTime() - JSON.parse(localStorage.getItem('posthogIdentifiedTime')) > 24 * 60 * 60 * 1000) {
      posthog.identify(userFid, {
        username: username,
        fid: userFid,
      })
      localStorage.setItem('posthogIdentifiedTime', JSON.stringify(new Date().getTime()))
    }
  }

  const posthogLogin = (userFid) => {
    // capture the login event, only 1 time per 4 hours
    if (!localStorage.getItem('posthogLoginTime') || new Date().getTime() - JSON.parse(localStorage.getItem('posthogLoginTime')) > 4 * 60 * 60 * 1000) {
      posthog.capture('login', {
        asFid: userFid,
      })
      localStorage.setItem('posthogLoginTime', JSON.stringify(new Date().getTime()))
    }
  }

  const readUserStateFromDatabase = async () => {
    const accessToken = await getAccessToken();

    axios.get(`${HOST_URL}/api/user/state`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
      .then((response) => {
        if (response.data.state.userFid === 0 && response.data.state.plan !== PLAN.FREE) {
          router.push('/create-account')
        } else {
          if (response.data.state.userFid !== 0) {
            posthogIdentify(response.data.state.userFid, response.data.state.accounts.find((account) => account.fid === response.data.state.currentFid).username)
          }

          // check if the current fid is in the accounts from response
          const currentFid = (supercastUserState.currentFid && response.data.state.accounts.find((account) => account.fid === supercastUserState.currentFid))
            ? supercastUserState.currentFid
            : response.data.state.currentFid

          posthogLogin(currentFid)

          setSuperCastUserState((prevState) => ({
            accounts: response.data.state.accounts,
            userFid: response.data.state.userFid,
            currentFid: currentFid,
            plan: response.data.state.plan,
            planState: response.data.state.planState,
          }))
        }
      })
      .catch((error) => {
        console.error(error)
      })
  }

  const fetchDraft = async () => {
    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/drafts/${draftId}/preview`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    });
    return response.data;
  };

  const draftQuery = useQuery(
    ['drafts', draftId, supercastUserState],
    fetchDraft,
    {
      enabled: !!supercastUserState,
    }
  );

  useEffect(() => {
    if (draftQuery.status === 'success' && draftQuery.data) {
      setReactionCount(draftQuery.data.reactionCount)
      setRecastCount(draftQuery.data.recastCount)
      setReactionStatus(draftQuery.data.reactionStatus)
      setRecastStatus(draftQuery.data.recastStatus)
      setAuthor(draftQuery.data.profiles)
    }
  }, [draftQuery.status])

  return (
    <div className='sticky top-0 flex flex-col min-h-screen max-h-screen overflow-y-auto'>
      {draftQuery.isLoading && <Spinner />}
      {draftQuery.isError && <div>Error</div>}
      {draftQuery.isSuccess && (
        <div className='pt-3 pb-2'>
          <div className="flex flex-row px-4 py-2">
            <div className="mr-2 flex-shrink-0">
              {!!draftQuery.data.author.pfp_url
                ?
                <Link href={`/${draftQuery.data.author.username}`}>
                  <ProfileHoverCard
                    fid={draftQuery.data.author.fid}
                    avatar={draftQuery.data.author.pfp_url}
                    username={draftQuery.data.author.username}
                    displayName={draftQuery.data.author.display_name}
                    bio={draftQuery.data.author.profile.bio.text}
                    followingCount={draftQuery.data.author.followingCount}
                    followerCount={draftQuery.data.author.followerCount}
                    powerBadge={draftQuery.data.author.powerBadge}
                  >
                    <Avatar className='h-10 w-10'>
                      <AvatarImage
                        src={draftQuery.data.author.pfp_url}
                        alt='Profile picture'
                      />
                      <AvatarFallback>
                        <Skeleton
                          className="h-12 w-12"
                        />
                      </AvatarFallback>
                    </Avatar>
                  </ProfileHoverCard>
                </Link>
                :
                <span className="inline-block h-10 w-10 overflow-hidden rounded-full bg-gray-100">
                  <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>
              }
            </div>
            <div className="flex flex-col flex-grow">
              <div className="flex flex-row text-sm mb-1 items-center justify-between max-w-[280px] xs:max-w-[310px] sm:max-w-none">
                <div className='flex flex-row items-center'>
                  <ProfileHoverCard
                    fid={draftQuery.data.author.fid}
                    avatar={draftQuery.data.author.pfp_url}
                    username={draftQuery.data.author.username}
                    displayName={draftQuery.data.author.display_name}
                    bio={draftQuery.data.author.profile.bio.text}
                    followingCount={draftQuery.data.author.followingCount}
                    followerCount={draftQuery.data.author.followerCount}
                    powerBadge={draftQuery.data.author.powerBadge}
                  >
                    <Link href={`/${draftQuery.data.author.username}`} className='font-semibold mr-1 hover:underline dark:text-gray-100 flex flex-row items-center max-w-[130px] xs:max-w-[145px] sm:max-w-[280px]'>
                      <span className={`${draftQuery.data.author.powerBadge && "mr-1"} truncate`}>{draftQuery.data.author.display_name}</span> {draftQuery.data.author.powerBadge && <PowerBadge />}
                    </Link>
                  </ProfileHoverCard>
                  <ProfileHoverCard
                    fid={draftQuery.data.author.fid}
                    avatar={draftQuery.data.author.pfp_url}
                    username={draftQuery.data.author.username}
                    displayName={draftQuery.data.author.display_name}
                    bio={draftQuery.data.author.profile.bio.text}
                    followingCount={draftQuery.data.author.followingCount}
                    followerCount={draftQuery.data.author.followerCount}
                    powerBadge={draftQuery.data.author.powerBadge}
                  >
                    <div className='max-w-[90px] xs:max-w-[105px] sm:max-w-[200px] truncate'>
                      <Link href={`/${draftQuery.data.author.username}`} className='text-gray-500 dark:text-gray-400 hover:underline truncate'>@{draftQuery.data.author.username}</Link>
                    </div>
                  </ProfileHoverCard>
                </div>
              </div>
              <div className='mb-2'>
                <p
                  className="text-sm text-gray-900 dark:text-gray-100 mb-2 break-words max-w-[280px] xs:max-w-[310px] xl:max-w-[500px]"
                >
                  <CastText text={draftQuery.data.draft.text} />
                </p>
                <div className='flex flex-col gap-y-1'>
                  {draftQuery.data.draft.embeds.map((embed) => (
                    !!embed.url && <URLPreviewCard url={embed.url} small={false} castHash={draftQuery.data.draft.hash} ignoreList={!!draftQuery.data.draft.frames ? draftQuery.data.draft.frames.map((frame) => frame.frames_url) : []} />
                  ))}
                  {draftQuery.data.draft.embeds.map((embed) => (
                    !!embed.castId && <Recast hash={embed.castId.hash} />
                  ))}
                  {!!draftQuery.data.draft.frames &&
                    draftQuery.data.draft.frames.map((frame, index) => (
                      <FarcasterFrame
                        key={index + frame.version}
                        castHash={draftQuery.data.draft.hash}
                        version={frame.version}
                        image={frame.image}
                        image_aspect_ratio={frame.image_aspect_ratio}
                        buttons={frame.buttons}
                        frame_url={frame.frames_url}
                        post_url={frame.post_url}
                        input={frame.input}
                      />
                    ))}
                </div>
              </div>
              {!!parentURLToChannelName(draftQuery.data.draft.parent_url) &&
                <div className='flex items-center border rounded-md text-xs max-w-fit px-1 py-0.5 mb-1 dark:border-gray-700'>
                  <Link
                    onClick={(e) => e.stopPropagation()}
                    href={`/channel/${parentURLToChannelId(draftQuery.data.draft.parent_url)}`}
                    className='text-gray-500 dark:text-gray-400 hover:underline'>{`/${parentURLToChannelName(draftQuery.data.draft.parent_url)}`}
                  </Link>
                </div>
              }
              <DraftPreviewReactionBar
                draftId={draftQuery.data.draft.id}
                authorFid={draftQuery.data.author.fid}
                replyCount={draftQuery.data.scheduledReplies.length}
                reactionStatus={reactionStatus}
                setReactionStatus={setReactionStatus}
                reactionCount={reactionCount}
                setReactionCount={setReactionCount}
                recastStatus={recastStatus}
                setRecastStatus={setRecastStatus}
                recastCount={recastCount}
                setRecastCount={setRecastCount}
                login={login}
              />
            </div>
          </div>
          {draftQuery.data.threadChildren.length > 0 &&
            <ul>
              {draftQuery.data.threadChildren.map((child, index) => (
                <li
                  key={child.hash}
                >
                  <DraftPreviewThreadChild draft={child} author={draftQuery.data.author} isLast={index === draftQuery.data.threadChildren.length - 1} />
                </li>
              ))}
            </ul>
          }
          <DraftPreviewReplyTextArea parentDraftId={draftId} replies={newReplies} setReplies={setNewReplies} login={login} />
          <div className='border-t w-full dark:border-gray-800'></div>
          {newReplies.length > 0 &&
            <ul>
              {newReplies.map((reply, index) => (
                <li
                  key={reply.id}
                >
                  <DraftPreviewScheduledReply reply={reply} author={reply.author} isLast={true} />
                </li>
              ))}
            </ul>
          }
          {draftQuery.data.scheduledReplies.length > 0 &&
            <ul>
              {draftQuery.data.scheduledReplies.map((reply, index) => (
                <li
                  key={reply.id}
                >
                  <DraftPreviewScheduledReply reply={reply} author={reply.author} isLast={true} />
                </li>
              ))}
            </ul>
          }
        </div>
      )}
    </div>
  )
}
