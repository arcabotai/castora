import { prisma } from "@/prisma/client"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
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

  const updatedDraft = await prisma.draft.update({
    where: {
      id: params.id,
      authorId: farcasterAccount.id,
    },
    data: {
      sendStatus: DRAFT_SEND_STATUS.SCHEDULED,
    },
    include: {
      author: true,
    }
  })

  trackPosthogEvent(supercastUser.fid, "cast_scheduled", {
    "asFid": targetFid,
    "channel_id": updatedDraft.channelId,
  })

  return Response.json({ draft: updatedDraft })
}