import axios from "axios"
import { neynar } from '@/lib/neynar'
import { privateCacheHeaders, publicCacheHeaders } from "@/utils/cacheHeaders"

export async function GET(req: Request) {

  const url = new URL(req.url)

  const profileFid = url.searchParams.get("profileFid")
  const ownerFid = url.searchParams.get("ownerFid")
  const nextCursor = url.searchParams.get("cursor")
  const viewerFidParam = ownerFid && ownerFid !== "0" ? `&viewer_fid=${ownerFid}` : ""
  const responseHeaders = ownerFid && ownerFid !== "0"
    ? privateCacheHeaders
    : publicCacheHeaders({ browserMaxAge: 60, cdnMaxAge: 300, staleWhileRevalidate: 1800 })

  const response = await neynar.get(`/v2/farcaster/reactions/user/?fid=${profileFid}${viewerFidParam}&type=likes&limit=25&cursor=${nextCursor}`)

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  const casts = response.data.reactions.map((reaction: any) => reaction.cast)

  return Response.json({ "casts": casts, "cursor": response.data.cursor }, { headers: responseHeaders })
}
