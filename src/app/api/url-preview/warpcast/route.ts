import axios from "axios"
import { neynar } from '@/lib/neynar'
import { publicCacheHeaders } from "@/utils/cacheHeaders"

export async function GET(req: Request) {

  const url = new URL(req.url)

  const query = url.searchParams.get("query")

  if (!query) {
    return Response.json({ error: "query is required" }, { status: 400 })
  }

  const response = await neynar.get(`/v2/farcaster/cast/?type=url&identifier=${encodeURIComponent(query)}`)

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  return Response.json({ "cast": response.data.cast }, {
    headers: publicCacheHeaders({ browserMaxAge: 120, cdnMaxAge: 3600, staleWhileRevalidate: 86400 }),
  })
}
