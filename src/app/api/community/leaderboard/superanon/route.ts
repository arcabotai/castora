import { calculateLeaderboard } from '@/utils/anon/leaderboard'
import { isAuthenticated } from '@/utils/auth/isAuthenticated'
import Redis from 'ioredis'

const CACHE_TTL = 24 * 60 * 60 // 24 hours in seconds
const redis = new Redis(process.env.REDIS_URL!)

export async function GET(req: Request) {
  try {
    const { authenticated, supercastUser } = await isAuthenticated(req)

    if (!authenticated) {
      return Response.json({ "error": "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const days = Number(searchParams.get('days')) || "lifetime"

    // Check cache first
    const cacheKey = `leaderboard:superanon:${days}`
    const cachedDataString = await redis.get(cacheKey)
    const cachedData = cachedDataString ? JSON.parse(cachedDataString) : null

    if (cachedData) {
      return Response.json(cachedData)
    }

    const leaderboard = await calculateLeaderboard(days);

    return Response.json(leaderboard)
  } catch (error) {
    console.error('Error fetching superanon leaderboard:', error)
    return Response.json({ "error": "Internal Server Error" }, { status: 500 })
  }
} 