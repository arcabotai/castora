import axios from "axios"
import { privateCacheHeaders, publicCacheHeaders } from "@/utils/cacheHeaders"

export async function GET(req: Request) {

  const url = new URL(req.url)

  const profileFid = url.searchParams.get("profileFid")
  const targetFid = url.searchParams.get("ownerFid")
  const nextCursor = url.searchParams.get("cursor")
  const viewerFidParam = targetFid && targetFid !== "0" ? `&viewer_fid=${targetFid}` : ""
  const responseHeaders = targetFid && targetFid !== "0"
    ? privateCacheHeaders
    : publicCacheHeaders({ browserMaxAge: 60, cdnMaxAge: 300, staleWhileRevalidate: 1800 })

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/feed/?feed_type=filter&with_recasts=false&filter_type=fids${viewerFidParam}&fids=${profileFid}&limit=10&cursor=${nextCursor}`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  return Response.json({ "casts": response.data.casts, "cursor": response.data.next.cursor }, { headers: responseHeaders })
}
