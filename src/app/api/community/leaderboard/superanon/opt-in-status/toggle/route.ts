import { prisma } from '@/prisma/client'
import { isAuthenticated } from '@/utils/auth/isAuthenticated'

export async function PUT(req: Request) {
  try {
    const { authenticated, supercastUser } = await isAuthenticated(req)

    if (!authenticated || !supercastUser) {
      return Response.json({ "error": "Not authenticated" }, { status: 401 })
    }

    const user = await prisma.supercastPrivyUser.update({
      where: {
        id: supercastUser.id
      },
      data: {
        superanonLeaderboardOptIn: !supercastUser.superanonLeaderboardOptIn
      },
      select: {
        superanonLeaderboardOptIn: true
      }
    })

    return Response.json({
      optedIn: user.superanonLeaderboardOptIn
    })
  } catch (error) {
    console.error('Error toggling superanon opt-in status:', error)
    return Response.json({ "error": "Internal Server Error" }, { status: 500 })
  }
} 