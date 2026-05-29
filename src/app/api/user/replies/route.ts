import axios from "axios"
import { neynar } from '@/lib/neynar'
import { prisma } from '@/prisma/client'
import { Cast } from "@/types"
import { isAuthorized } from "@/utils/auth/isAuthorized";
import { isAuthenticated } from "@/utils/auth/isAuthenticated";

type CastWithProfileRecast = Cast & {
  profileRecast: boolean;
};

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

  const profileFid = url.searchParams.get("profileFid")
  const nextCursor = url.searchParams.get("cursor")

  const ownerBookmarks = await prisma.bookmark.findMany({
    where: {
      ownerFid: Number(targetFid),
    }
  }).then((bookmarks) => {
    return bookmarks.map((bookmark: any) => {
      return bookmark.castHash
    })
  })

  const response = await neynar.get(`/v2/farcaster/feed/user/replies_and_recasts/?limit=10&viewer_fid=${targetFid}&cursor=${nextCursor}&fid=${profileFid}`)

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  return Response.json({ "casts": response.data.casts, "cursor": response.data.next.cursor })
}
