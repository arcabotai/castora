import { prisma } from '@/prisma/client'
import { isAuthenticated } from '@/utils/auth/isAuthenticated'

export async function GET(req: Request) {
  try {
    const { authenticated, supercastUser } = await isAuthenticated(req)

    if (!authenticated || !supercastUser) {
      return Response.json({ "error": "Not authenticated" }, { status: 401 })
    }

    const user = await prisma.supercastPrivyUser.findUnique({
      where: {
        id: supercastUser.id
      },
      select: {
        superanonLeaderboardOptIn: true
      }
    })

    return Response.json({
      optedIn: user?.superanonLeaderboardOptIn ?? false
    })
  } catch (error) {
    console.error('Error fetching superanon opt-in status:', error)
    return Response.json({ "error": "Internal Server Error" }, { status: 500 })
  }
} 