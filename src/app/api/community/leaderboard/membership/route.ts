import { prisma } from '@/prisma/client'
import { isAuthenticated } from '@/utils/auth/isAuthenticated'
import { PLAN } from '@prisma/client'
import axios from 'axios'
import { neynar } from '@/lib/neynar'
import { redis } from '@/utils/redis'

const CACHE_TTL = 24 * 60 * 60 // 24 hours in seconds

export async function GET(req: Request) {
  try {
    const { authenticated, supercastUser } = await isAuthenticated(req)

    if (!authenticated) {
      return Response.json({ "error": "Not authenticated" }, { status: 401 })
    }

    // Check cache first
    const cacheKey = 'leaderboard:membership'
    const cachedDataString = await redis.get(cacheKey)
    const cachedData = cachedDataString ? JSON.parse(cachedDataString) : null

    if (cachedData) {
      return Response.json(cachedData)
    }

    // If no cache, fetch fresh data
    const users = await prisma.supercastPrivyUser.findMany({
      where: {
        plan: PLAN.PERSONAL,
        paidUntil: {
          not: null,
        },
        fid: {
          not: 0,
        },
      },
      select: {
        fid: true,
        paidUntil: true,
      },
      orderBy: {
        paidUntil: 'desc',
      },
      take: 100,
    })

    const allFids = users.map(user => user.fid).join(",");

    if (!allFids) {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify([]))
      return Response.json([])
    }

    const response = await neynar.get(`/v2/farcaster/user/bulk/?fids=${allFids}`, {
      timeout: 5000,
    })

    if (response.status !== 200) {
      return Response.json(response.data, { status: response.status })
    }

    const leaderboard = users.map(user => ({
      fid: user.fid,
      score: user.paidUntil!.getTime(),
      username: response.data.users.find(u => u.fid === user.fid)?.username,
      avatar: response.data.users.find(u => u.fid === user.fid)?.pfp_url,
    }))

    // Cache the leaderboard data
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(leaderboard))

    return Response.json(leaderboard)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching membership leaderboard:', {
        status: error.response?.status,
        code: error.code,
        message: error.message,
      })
    } else {
      console.error('Error fetching membership leaderboard:', error)
    }
    return Response.json({ "error": "Internal Server Error" }, { status: 500 })
  }
} 
