import axios from "axios"

import { isAuthenticated } from "@/utils/auth/isAuthenticated";
import { isAuthorized } from "@/utils/auth/isAuthorized";

import Redis from 'ioredis'

const CACHE_TTL = 24 * 60 * 60 // 24 hours in seconds
const redis = new Redis(process.env.REDIS_URL!)

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  let targetFid = Number(req.headers.get("asFid"))

  if (!!targetFid && !!authenticated) {

    const { authorized } = await isAuthorized(supercastUser, targetFid)

    if (!authorized) {
      return Response.json({ "error": "Unauthorized" }, { status: 403 })
    }
  } else {
    targetFid = Number(process.env.DEFAULT_GUEST_USER_FID)
  }

  const channel_id = params.slug

  // Check cache first
  const cacheKey = `channel:${channel_id}:preview:${targetFid}`
  const cachedDataString = await redis.get(cacheKey)
  const cachedData = cachedDataString ? JSON.parse(cachedDataString) : null

  if (cachedData) {
    return Response.json(cachedData)
  }

  const [trendingCastsResponse, channelInfoResponse] = await Promise.all([
    axios.get(`https://api.neynar.com/v2/farcaster/feed/trending/?limit=10&viewer_fid=${targetFid}&time_window=7d&channel_id=${channel_id}`, {
      headers: { "x-api-key": process.env.NEYNAR_API_KEY }
    }),
    axios.get(`https://api.neynar.com/v2/farcaster/channel/?id=${channel_id}&type=id&viewer_fid=${targetFid}`, {
      headers: { "x-api-key": process.env.NEYNAR_API_KEY }
    })
  ])

  const responseData = {
    "trending_casts": trendingCastsResponse.status === 200 ? trendingCastsResponse.data.casts : [],
    "channel": channelInfoResponse.status === 200 ? channelInfoResponse.data.channel : {},
  }

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(responseData))

  return Response.json(responseData)
}
