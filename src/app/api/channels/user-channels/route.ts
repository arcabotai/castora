import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from "axios"

import { redis } from '@/utils/redis'

const CACHE_TTL = 24 * 60 * 60 // 24 hours in seconds

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
  const cursor = url.searchParams.get("cursor")

  const cacheKey = `channel:user-channels:${targetFid}:${cursor}`
  const cachedDataString = await redis.get(cacheKey)
  const cachedData = cachedDataString ? JSON.parse(cachedDataString) : null

  if (cachedData) {
    return Response.json(cachedData)
  }

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/user/channels/?fid=${targetFid}&cursor=${cursor}&limit=10`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response.data))

  return Response.json({ "channels": response.data.channels, "cursor": response.data.cursor })
}
