import axios from "axios"
import { trackPosthogEvent } from "@/utils/posthogAnalytics";
import { isAuthenticated } from "@/utils/auth/isAuthenticated";
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  const targetFid = Number(req.headers.get("asFid"))

  const url = new URL(req.url)

  const cursor = url.searchParams.get("cursor")
  const channel_id = params.slug

  if (authenticated) {
    trackPosthogEvent(supercastUser.fid, "feed_refreshed", {
      "type": "channel",
      "asFid": targetFid,
    })
  }

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/feed?feed_type=filter&filter_type=channel_id&channel_id=${channel_id}&limit=10${targetFid ? `&viewer_fid=${targetFid}` : ''}&cursor=${cursor}`, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  return Response.json({ "casts": response.data.casts, "cursor": response.data.next.cursor })

}
