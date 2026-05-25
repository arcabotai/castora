import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from "axios"

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

  const followedFid = url.searchParams.get("followedFid")
  const cursor = url.searchParams.get("cursor")

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/followers/?fid=${followedFid}&viewer_fid=${targetFid}&limit=25&cursor=${cursor}`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  return Response.json({ "followers": response.data.users, "cursor": response.data.next.cursor })
}