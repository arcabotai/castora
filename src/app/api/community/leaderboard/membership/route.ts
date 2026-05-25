import { prisma } from '@/prisma/client'
import { isAuthorized } from '@/utils/auth/isAuthorized'
import { isAuthenticated } from '@/utils/auth/isAuthenticated'
import { PLAN } from '@prisma/client'
import axios from 'axios'
import Redis from 'ioredis'

const CACHE_TTL = 24 * 60 * 60 // 24 hours in seconds
const redis = new Redis(process.env.REDIS_URL!)

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

    const response = await axios.get(`https://api.neynar.com/v2/farcaster/user/bulk/?fids=${allFids}`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

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
    console.error('Error fetching membership leaderboard:', error)
    return Response.json({ "error": "Internal Server Error" }, { status: 500 })
  }
} 