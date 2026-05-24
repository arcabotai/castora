import { prisma } from "@/prisma/client"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"
import { DRAFT_RECURRING_SCHEDULE, DRAFT_SEND_STATUS } from "@prisma/client"
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

  const { authorized, farcasterAccount } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  const updatedDraft = await prisma.draft.update({
    where: {
      id: params.id,
      authorId: farcasterAccount.id,
    },
    data: {
      sendStatus: DRAFT_SEND_STATUS.DRAFT,
      firstScheduledAt: null,
      nextScheduledAt: null,
      recurring: DRAFT_RECURRING_SCHEDULE.NONE,
    },
    include: {
      author: true,
    }
  })

  trackPosthogEvent(supercastUser.fid, "cast_unscheduled", {
    "draft_id": updatedDraft.id,
    "asFid": targetFid,
  })

  return Response.json({ draft: updatedDraft })
}