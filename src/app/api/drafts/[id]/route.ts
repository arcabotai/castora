import { prisma } from "@/prisma/client"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { DRAFT_SEND_STATUS } from "@prisma/client"
import axios from "axios"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, farcasterAccount } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  const draft = await prisma.draft.findUnique({
    where: {
      id: params.id,
      authorId: farcasterAccount.id,
      creatorId: supercastUser.id
    },
    include: {
      replyDraft: true
    }
  })

  const replies = []
  let lastReply = draft.replyDraft

  while (!!lastReply) {
    replies.push(lastReply)

    const nextReply = await prisma.draft.findUnique({
      where: {
        id: lastReply.id,
        authorId: farcasterAccount.id,
      },
      include: {
        replyDraft: true
      }
    })
    lastReply = nextReply.replyDraft
  }

  return Response.json({ draft: draft, replies: replies })
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, farcasterAccount } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  const { text, embeds, channelId, firstScheduledAt, recurring, shared } = await req.json()

  // only update the fields that are provided
  const dataToUpdate = {
    ...(text && { text }),
    ...(embeds && { embeds }),
    ...(channelId && { channelId }),
    ...(firstScheduledAt && { firstScheduledAt }),
    ...(firstScheduledAt && { nextScheduledAt: firstScheduledAt }),
    ...(recurring && { recurring }),
    ...(shared && { shared }),
  }

  const draft = await prisma.draft.update({
    where: {
      id: params.id,
      authorId: farcasterAccount.id,
    },
    data: dataToUpdate
  })

  return Response.json({ draft })
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, farcasterAccount } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  // if there is a reply, update parent id of the reply to current parent id

  const draft = await prisma.draft.findUnique({
    where: {
      id: params.id,
      authorId: farcasterAccount.id,
    },
    include: {
      replyDraft: true
    }
  })

  await prisma.draft.update({
    where: {
      id: params.id
    },
    data: {
      sendStatus: DRAFT_SEND_STATUS.DELETED
    }
  })

  if (draft.replyDraft) {
    await prisma.draft.update({
      where: {
        id: draft.replyDraft.id,
        authorId: farcasterAccount.id,
      },
      data: {
        parentId: draft.parentId
      }
    })
  }

  return Response.json({ draft })
}