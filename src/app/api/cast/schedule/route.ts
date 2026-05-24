import { prisma } from '@/prisma/client'
import { isAuthenticated } from '@/utils/auth/isAuthenticated'
import { isAuthorized } from '@/utils/auth/isAuthorized'
import { EVENT_TYPE, SCHEDULED_CAST_STATUS } from '@prisma/client'

export async function POST(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, error_message } = await isAuthorized(supercastUser, targetFid, true)

  if (!authorized) {
    return Response.json({ "error": error_message }, { status: 403 })
  }

  const {
    text,
    embedURLs,
    embedRecasts,
    parentURL,
    scheduledAt,
  } = await req.json()

  const farcasterAccount = await prisma.supercastFarcasterAccount.findFirst({
    where: {
      fid: Number(targetFid),
    },
  });

  const scheduledCast = await prisma.scheduledCast.create({
    data: {
      text: text,
      embedURLs: embedURLs,
      embedRecasts: embedRecasts,
      parentURL: parentURL,
      scheduledAt: scheduledAt,
      status: SCHEDULED_CAST_STATUS.PENDING,
      supercastFarcasterAccountId: farcasterAccount.id,
    },
  })

  return Response.json({ "scheduledCast": scheduledCast })
}
