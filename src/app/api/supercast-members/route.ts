import { prisma } from '@/prisma/client'
import { isAuthorized } from '@/utils/auth/isAuthorized'
import { isAuthenticated } from '@/utils/auth/isAuthenticated'

export async function GET(req: Request) {
  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ "error": "Unauthorized" }, { status: 403 })
  }

  try {
    const premiumFids = await prisma.supercastFarcasterAccount.findMany({
      where: {
        ConnectedAccount: {
          some: {
            SupercastPrivyUser: {
              plan: 'PERSONAL',
            },
          },
        },
      },
      select: {
        fid: true,
      },
      distinct: ['fid'],
    });

    return Response.json({ "members": premiumFids.map(account => account.fid) })
  } catch (error) {
    console.error('Error fetching premium users:', error)
    return Response.json({ "error": "Internal server error" }, { status: 500 })
  }
}