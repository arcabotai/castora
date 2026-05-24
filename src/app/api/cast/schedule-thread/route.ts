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

  const { authorized, farcasterAccount, error_message } = await isAuthorized(supercastUser, targetFid, true)

  if (!authorized) {
    return Response.json({ "error": error_message }, { status: 403 })
  }

  const {
    casts,
    scheduledAt,
    parentURL,
  } = await req.json()

  const scheduledThread = await prisma.scheduledThread.create({
    data: {
      scheduledAt: scheduledAt,
      parentURL: parentURL,
      status: SCHEDULED_CAST_STATUS.PENDING,
      supercastFarcasterAccountId: farcasterAccount.id,
    },
  })

  casts.map(async (cast) => {
    const embedURLs = cast.castEmbeds.filter((embed) => embed.url).map((embed) => embed.url)
    const embedRecasts = cast.castEmbeds.filter((embed) => embed.cast_id).map((embed) => embed.cast_id)

    await prisma.scheduledCast.create({
      data: {
        text: cast.castText,
        embedURLs: embedURLs,
        embedRecasts: embedRecasts,
        parentURL: parentURL,
        scheduledAt: scheduledAt,
        status: SCHEDULED_CAST_STATUS.PENDING,
        scheduledThreadId: scheduledThread.id,
        threadPosition: cast.position,
        supercastFarcasterAccountId: farcasterAccount.id,
      },
    })
  })

  return Response.json({ "scheduledThread": scheduledThread })
}
