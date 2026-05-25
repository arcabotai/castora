import axios from "axios"
import { prisma } from '@/prisma/client'
import { Cast } from "@/types"
import { isAuthenticated } from "@/utils/auth/isAuthenticated";
import { isAuthorized } from "@/utils/auth/isAuthorized";

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

  const ownerBookmarks = await prisma.bookmark.findMany({
    where: {
      ownerFid: Number(targetFid),
    }
  }).then((bookmarks) => {
    return bookmarks.map((bookmark: any) => {
      return bookmark.castHash
    })
  })

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/feed/user/popular/?fid=${profileFid}&viewer_fid=${targetFid}`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  return Response.json({ "casts": response.data.casts })
}
