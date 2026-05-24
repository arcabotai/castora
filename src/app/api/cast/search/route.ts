import axios from "axios"
import { isAuthenticated } from "@/utils/auth/isAuthenticated";
import { isAuthorized } from "@/utils/auth/isAuthorized";
import { trackPosthogEvent } from "@/utils/posthogAnalytics";

export async function GET(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid")) || Number(process.env.DEFAULT_GUEST_USER_FID)

  const { authorized } = await isAuthorized(supercastUser, targetFid, false, null, "READ_SEARCH")

  if (!authorized) {
    return Response.json({ "error": "Unauthorized" }, { status: 403 })
  }

  const url = new URL(req.url)

  const cursor = url.searchParams.get("cursor")
  const searchQuery = url.searchParams.get("sq")


  trackPosthogEvent(supercastUser.fid, "cast_searched", {
    "query": searchQuery,
    "asFid": targetFid,
  })

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/cast/search?q=${searchQuery}&viewer_fid=${targetFid}&cursor=${cursor}&limit=15`, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })

  if (response.status !== 200) {
    return Response.json(response.data.casts, { status: response.status })
  }

  return Response.json({ "casts": response.data.result.casts, "cursor": response.data.result.next.cursor })

}
