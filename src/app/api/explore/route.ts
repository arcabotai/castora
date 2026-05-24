import axios from "axios"
import { prisma } from '@/prisma/client'

import { isAuthenticated } from "@/utils/auth/isAuthenticated";
import { isAuthorized } from "@/utils/auth/isAuthorized";

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

  let bookmarkedCasts = []
  let trendingCasts = []
  let trendingChannels = []

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      ownerFid: Number(targetFid),
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10
  })

  const trendingCastsResponse = await axios.get(`https://api.neynar.com/v2/farcaster/feed?feed_type=filter&filter_type=global_trending&limit=10&viewer_fid=${targetFid}`, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })

  if (trendingCastsResponse.status === 200) {
    trendingCasts = trendingCastsResponse.data.casts
  }

  const trendingChannelsResponse = await axios.get(`https://api.neynar.com/v2/farcaster/channel/trending?time_window=1d&limit=10`, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })

  if (trendingChannelsResponse.status === 200) {
    trendingChannels = trendingChannelsResponse.data.channels
  }

  if (bookmarks.length > 0) {

    const firstBookmarks = bookmarks.slice(0, 10)

    const castHashes = firstBookmarks.map((bookmark: any) => (bookmark.castHash)).join(',')

    const bookmarkHashes = firstBookmarks.map((bookmark: any) => bookmark.castHash)

    const response = await axios.get(`https://api.neynar.com/v2/farcaster/casts?viewer_fid=${targetFid}&casts=${castHashes}`, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })

    if (response.status === 200 || response.status === 206) {
      bookmarkedCasts = response.data.result.casts
    }
  }

  return Response.json({
    "trending_casts": trendingCasts,
    "trending_channels": trendingChannels,
    "bookmarks": bookmarkedCasts,
  })
}
