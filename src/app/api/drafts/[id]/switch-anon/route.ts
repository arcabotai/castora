import { prisma } from "@/prisma/client"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"

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

  const { isAnon } = await req.json()

  // if is anon, clear the channel id
  const dataToUpdate = {
    isAnon,
    ...(isAnon && { channelId: "" }),
  }

  async function updateDraftAndReplies(draftId: string): Promise<void> {

    const draft = await prisma.draft.update({
      where: {
        id: draftId,
        authorId: farcasterAccount.id,
      },
      data: dataToUpdate,
      include: {
        replyDraft: true
      }
    })

    if (draft.replyDraft) {
      await updateDraftAndReplies(draft.replyDraft.id)
    }
  }

  await updateDraftAndReplies(params.id)

  const updatedDraft = await prisma.draft.findUnique({
    where: {
      id: params.id,
      authorId: farcasterAccount.id,
    },
    include: {
      replyDraft: true
    }
  })

  return Response.json({ draft: updatedDraft })
}
