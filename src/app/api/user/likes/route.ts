import axios from "axios"
import { prisma } from '@/prisma/client'

export async function GET(req: Request) {

  const url = new URL(req.url)

  const profileFid = url.searchParams.get("profileFid")
  const ownerFid = url.searchParams.get("ownerFid")
  const nextCursor = url.searchParams.get("cursor")

  const ownerBookmarks = await prisma.bookmark.findMany({
    where: {
      ownerFid: Number(ownerFid),
    }
  }).then((bookmarks) => {
    return bookmarks.map((bookmark: any) => {
      return bookmark.castHash
    })
  })

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/reactions/user?fid=${profileFid}&viewer_fid=${ownerFid}&type=likes&limit=25&cursor=${nextCursor}`, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  const casts = response.data.reactions.map((reaction: any) => reaction.cast)

  return Response.json({ "casts": casts, "cursor": response.data.cursor })
}
