import { prisma } from "@/prisma/client"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { sendDraftToFarcaster, sendScheduledReactions } from "@/utils/drafts"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"
import { DRAFT_SEND_STATUS } from "@prisma/client"
import axios from "axios"


export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, farcasterAccount, error_message } = await isAuthorized(supercastUser, targetFid, true)

  if (!authorized) {
    return Response.json({ "error": error_message }, { status: 403 })
  }

  const draft = await prisma.draft.findUnique({
    where: {
      id: params.id,
      authorId: farcasterAccount.id,
    },
    include: {
      author: true,
      parentDraft: true,
      creator: true,
    }
  })

  try {
    const updatedDraft = await sendDraftToFarcaster(draft)
    return Response.json({ draft: updatedDraft })

  } catch (error) {
    return Response.json({ "error": error.message }, { status: 403 })
  }
}
