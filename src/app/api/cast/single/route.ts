import axios from "axios"
import { neynar } from '@/lib/neynar'
import { Cast } from "@/types"
import { privateCacheHeaders, publicCacheHeaders } from "@/utils/cacheHeaders"

export async function GET(req: Request) {

  const targetFid = Number(req.headers.get("asFid"))
  const responseHeaders = targetFid
    ? privateCacheHeaders
    : publicCacheHeaders({ browserMaxAge: 60, cdnMaxAge: 300, staleWhileRevalidate: 1800 })

  const url = new URL(req.url)

  const hash = url.searchParams.get("hash")

  try {

    const response = await neynar.get(`/v2/farcaster/cast/?type=hash&identifier=${hash}${!!targetFid ? `&viewer_fid=${targetFid}` : ""}`)

    return Response.json({ "currentCast": response.data.cast }, { headers: responseHeaders })

  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status || 500 : 500
    return Response.json({ "error": "Cast not found" }, { status })
  }
}
