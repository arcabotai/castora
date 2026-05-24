import { prisma } from "@/prisma/client"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"
import { DRAFT_SEND_STATUS, REACTION_TYPE } from "@prisma/client"
import axios from "axios"


export async function DELETE(
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

  const unscheduledReactions = await prisma.scheduledReaction.deleteMany({
    where: {
      draftId: params.id,
      reactionAuthorId: farcasterAccount.id,
      reaction: REACTION_TYPE.RECAST,
    }
  })

  return Response.json({ reactions: unscheduledReactions })
}