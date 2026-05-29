import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from "axios"
import { neynar } from '@/lib/neynar'

// new way of fetching channels
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {

  const channel_id = params.slug

  const response = await neynar.get(`/v2/farcaster/channel/?id=${channel_id}`)

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  return Response.json({ "channel": response.data.channel })
}
