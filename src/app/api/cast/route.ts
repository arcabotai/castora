import axios from "axios"
import { neynar } from '@/lib/neynar'

import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"
import { prisma } from "@/prisma/client"
import { isValidAnonPost } from "@/utils/anon/moderation"
import { sendDraftToFarcaster } from "@/utils/drafts"
import { DRAFT_SEND_STATUS } from "@prisma/client"
import { privateCacheHeaders, publicCacheHeaders } from "@/utils/cacheHeaders"

const getReplies = (currentCast) => {
  let replies = []
  const topLevelReplies = currentCast.direct_replies

  for (const reply of topLevelReplies) {
    const replyAuthorAnswer = reply.direct_replies.find((cast: any) => cast.author.fid === currentCast.author.fid)
    if (replyAuthorAnswer) {
      replies.push([reply, replyAuthorAnswer])
    } else {
      replies.push([reply])
    }
  }

  return replies
}

const getThreadChildren = (currentCast) => {
  let threadChildren = []

  if (currentCast.direct_replies.length === 0) {
    return threadChildren
  }

  let earliestReply = null

  // find the earliest reply from the same author fid
  earliestReply = currentCast.direct_replies
    .filter((reply: any) => reply.author.fid === currentCast.author.fid)
    .sort((a: any, b: any) => a.timestamp - b.timestamp)[0]

  if (!!earliestReply) {
    threadChildren.push(earliestReply)

    while (!!earliestReply) {
      const nextReply = earliestReply.direct_replies
        .filter((cast: any) => cast.author.fid === currentCast.author.fid)
        .sort((a: any, b: any) => a.timestamp - b.timestamp)[0]

      if (!nextReply) {
        break
      }

      threadChildren.push(nextReply)
      earliestReply = nextReply
    }
  }

  return threadChildren
}

export const maxDuration = 240;

export async function POST(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, farcasterAccount, error_message } = await isAuthorized(supercastUser, targetFid, true)

  if (!authorized) {
    return Response.json({ "error": error_message }, { status: 403 })
  }

  const ANON_MODE_ENABLED = process.env.NEXT_PUBLIC_ANON_MODE_ENABLED === 'true';
  const SUPERANON_FID = Number(process.env.NEXT_PUBLIC_SUPERANON_FID)

  const { text, parentHash, embeds, parentURL, isAnon } = await req.json()

  let anonDraft = null

  if (ANON_MODE_ENABLED && (isAnon || targetFid === SUPERANON_FID)) {

    anonDraft = await prisma.draft.create({
      data: {
        text: text,
        embeds: embeds,
        isAnon: true,
        isTopLevel: false,
        authorId: farcasterAccount.id,
        creatorId: supercastUser.id,
        channelId: null,
        parentId: null,
      },
      select: {
        id: true,
        text: true,
        embeds: true,
        isAnon: true,
        author: true,
        creator: true,
      }
    })

    const { isValid, errorMessage } = await isValidAnonPost(anonDraft)

    if (!isValid) {
      return Response.json({ "error": errorMessage }, { status: 403 })
    }
  }

  let parent = ""
  if (parentHash) {
    parent = parentHash
  } else if (parentURL) {
    parent = parentURL
  }

  const castData = {
    "text": text,
    "signer_uuid": (ANON_MODE_ENABLED && isAnon) ? process.env.SUPERANON_SIGNER_UUID : farcasterAccount.signerUUID,
    "parent": parent,
    "embeds": embeds,
  }

  try {
    const response = await neynar.post(`/v2/farcaster/cast/`, castData)

    trackPosthogEvent(supercastUser.fid, "cast_sent", {
      "parent_url": parentURL,
      "parent_hash": parentHash,
      "hash": response.data.cast.hash,
      "asFid": targetFid,
      "type": parentHash ? "reply" : "cast",
      "scheduled": false,
      "is_anon": isAnon,
    })

    if (anonDraft) {
      await prisma.draft.update({
        where: { id: anonDraft.id },
        data: {
          castHash: response.data.cast.hash,
          sendStatus: DRAFT_SEND_STATUS.SENT,
        }
      })
    }

    return Response.json({ "cast": response.data.cast })

  } catch (error) {

    const status = axios.isAxiosError(error) ? error.response?.status || 500 : 500;
    const code = axios.isAxiosError(error) ? error.response?.data?.code : undefined;

    if (code === "SignerNotApproved") {
      return Response.json({ "error": "NO_SIGNER_APPROVED" }, { status: 403 })
    }

    return Response.json({ "error": "Failed to send cast" }, { status })
  }
}

export async function GET(req: Request) {

  const url = new URL(req.url)

  const hash = url.searchParams.get("hash")

  const targetFid = Number(req.headers.get("asFid")) || 0
  const responseHeaders = targetFid
    ? privateCacheHeaders
    : publicCacheHeaders({ browserMaxAge: 60, cdnMaxAge: 300, staleWhileRevalidate: 1800 })

  const response = await neynar.get(`/v2/farcaster/cast/conversation/?identifier=${hash}&type=hash&reply_depth=5&sort_type=algorithmic&fold=above&include_chronological_parent_casts=true${!!targetFid ? `&viewer_fid=${targetFid}` : ""}&limit=50`)

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  let currentCast = response.data.conversation.cast

  let replies = getReplies(currentCast)

  let ancestors = response.data.conversation.chronological_parent_casts

  let threadChildren = getThreadChildren(currentCast)

  // if there are thread children, remove the first one from the replies array
  if (threadChildren.length > 0) {
    replies = replies.filter((reply: any[]) => reply[0].hash !== threadChildren[0].hash)
  }

  return Response.json({ "currentCast": currentCast, "replies": replies, "ancestorCasts": ancestors, "threadChildren": threadChildren }, { headers: responseHeaders })
}
