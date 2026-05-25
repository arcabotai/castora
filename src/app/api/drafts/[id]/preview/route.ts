import { prisma } from "@/prisma/client"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { REACTION_TYPE } from "@prisma/client"
import axios from "axios"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  const targetFid = Number(req.headers.get("asFid")) ? Number(req.headers.get("asFid")) : 1

  let farcasterAccount = null

  if (authenticated) {
    const accountData = await isAuthorized(supercastUser, targetFid)

    farcasterAccount = accountData.farcasterAccount
  }

  const draft = await prisma.draft.findUnique({
    where: {
      id: params.id,
      shared: true
    },
    include: {
      replyDraft: true,
      author: true
    }
  })

  if (!draft) {
    return Response.json({ "error": "Draft not found" }, { status: 404 })
  }

  const threadChildren = []
  let lastReply = draft.replyDraft

  while (!!lastReply) {
    threadChildren.push(lastReply)

    const nextReply = await prisma.draft.findUnique({
      where: {
        id: lastReply.id,
      },
      include: {
        replyDraft: true
      }
    })
    lastReply = nextReply.replyDraft
  }

  let profiles = []

  const scheduledReactions = await prisma.scheduledReaction.findMany({
    where: {
      draftId: draft.id,
    },
    include: {
      reactionAuthor: {
        select: {
          fid: true
        }
      },
    }
  })

  const scheduledLikes = scheduledReactions.filter(reaction => reaction.reaction === REACTION_TYPE.LIKE)
  const scheduledRecasts = scheduledReactions.filter(reaction => reaction.reaction === REACTION_TYPE.RECAST)
  const scheduledReplies = scheduledReactions.filter(reaction => reaction.reaction === REACTION_TYPE.REPLY)

  try {
    const fids = [draft.author.fid, ...scheduledReplies.map(reaction => reaction.reactionAuthor.fid)].join(',')

    const profilesResponse = await axios.get(`https://api.neynar.com/v2/farcaster/user/bulk/?fids=${fids}&viewer_fid=${targetFid}`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

    profiles = profilesResponse.data.users
  } catch (error) {
    console.error(error)
    return Response.json({ "error": error }, { status: error.response.status })
  }

  return Response.json({
    draft: draft,
    threadChildren: threadChildren,
    author: profiles.find(profile => profile.fid === draft.author.fid),
    scheduledReplies: scheduledReplies.map(reaction => ({
      ...reaction,
      author: profiles.find(profile => profile.fid === reaction.reactionAuthor.fid)
    })),
    reactionCount: scheduledLikes.length,
    recastCount: scheduledRecasts.length,
    scheduledReplyCount: scheduledReplies.length,
    reactionStatus: !!farcasterAccount ? scheduledLikes.some(reaction => reaction.reactionAuthorId === farcasterAccount.id) : false,
    recastStatus: !!farcasterAccount ? scheduledRecasts.some(reaction => reaction.reactionAuthorId === farcasterAccount.id) : false,
    scheduledReplyStatus: !!farcasterAccount ? scheduledReplies.some(reaction => reaction.reactionAuthorId === farcasterAccount.id) : false,
  })
}
