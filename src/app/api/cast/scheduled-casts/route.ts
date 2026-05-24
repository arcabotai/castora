import { prisma } from '@/prisma/client'
import { isAuthenticated } from '@/utils/auth/isAuthenticated'
import { isAuthorized } from '@/utils/auth/isAuthorized'
import { SCHEDULED_CAST_STATUS } from '@prisma/client'

export async function GET(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get("status")

  const supercastUsers = await prisma.supercastUser.findMany({
    where: {
      fid: Number(targetFid),
    },
  })

  const supercastFarcasterAccounts = await prisma.supercastFarcasterAccount.findMany({
    where: {
      fid: Number(targetFid),
    },
  })

  const supercastUserIds = supercastUsers.map((user: any) => (user.id))

  // find all scheduled casts for all found authors
  const casts = await prisma.scheduledCast.findMany({
    where: {
      OR: [
        {
          supercastUserId: {
            in: supercastUserIds,
          },
        },
        {
          supercastFarcasterAccountId: {
            in: supercastFarcasterAccounts.map((account: any) => account.id),
          },
        },
      ],
      status: status as SCHEDULED_CAST_STATUS,
    },
  })

  return Response.json({ "casts": casts })
}
