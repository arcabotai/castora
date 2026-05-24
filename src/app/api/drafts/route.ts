import { prisma } from "@/prisma/client"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"
import { DRAFT_SEND_STATUS } from "@prisma/client"

export async function GET(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, farcasterAccount } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  const drafts = await prisma.draft.findMany({
    where: {
      authorId: farcasterAccount.id,
      isTopLevel: true,
      sendStatus: {
        not: DRAFT_SEND_STATUS.DELETED
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // remove creatorIf and authorId from the response
  const draftsMinimal = drafts.map((draft) => {
    return {
      ...draft,
      creatorId: undefined,
      authorId: undefined
    }
  })

  return Response.json({ drafts: draftsMinimal })
}

export async function POST(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, farcasterAccount } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  const { text, embeds, channelId, parentDraftId, isAnon } = await req.json()

  const draft = await prisma.draft.create({
    data: {
      text: text,
      embeds: embeds,
      channelId: channelId,
      creatorId: supercastUser.id,
      authorId: farcasterAccount.id,
      parentId: parentDraftId,
      isTopLevel: !!parentDraftId ? false : true,
      isAnon: isAnon
    }
  })

  trackPosthogEvent(supercastUser.fid, "draft_created", {
    "draft_id": draft.id,
    "asFid": targetFid,
  })

  return Response.json({ draft })
}

export async function DELETE(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, farcasterAccount } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  await prisma.draft.updateMany({
    where: {
      authorId: farcasterAccount.id,
      isTopLevel: true,
      sendStatus: {
        in: [DRAFT_SEND_STATUS.DRAFT, DRAFT_SEND_STATUS.SENT, DRAFT_SEND_STATUS.ERROR]
      }
    },
    data: {
      sendStatus: DRAFT_SEND_STATUS.DELETED
    }
  })

  const remainingDrafts = await prisma.draft.findMany({
    where: {
      authorId: farcasterAccount.id,
      isTopLevel: true,
      sendStatus: {
        not: DRAFT_SEND_STATUS.DELETED
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return Response.json({ drafts: remainingDrafts })
}
