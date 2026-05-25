import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from "axios"

// new way of fetching channels
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {

  const channel_id = params.slug

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/channel/?id=${channel_id}`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  return Response.json({ "channel": response.data.channel })
}
