import { prisma } from '@/prisma/client'
import axios from 'axios'

import { Cast } from '@/types'
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

  const url = new URL(req.url)
  const cursor = url.searchParams.get('cursor')

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      ownerFid: Number(targetFid),
    },
    take: 10,
    skip: cursor ? Number(cursor) : 0,
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (bookmarks.length === 0) {
    return Response.json({ "casts": [], "cursor": null })
  }

  const castHashes = bookmarks.map((bookmark: any) => (bookmark.castHash)).join(',')

  const bookmarkHashes = bookmarks.map((bookmark: any) => bookmark.castHash)

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/casts?viewer_fid=${targetFid}&casts=${castHashes}`, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })

  if (response.status !== 200 && response.status !== 206) {
    return Response.json(response.data, { status: response.status })
  }

  const casts = response.data.result.casts

  return Response.json({ "casts": casts, "cursor": cursor ? Number(cursor) + 10 : 10 })
}
