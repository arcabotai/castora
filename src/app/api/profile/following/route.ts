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

  const followingFid = url.searchParams.get("followingFid")
  const cursor = url.searchParams.get("cursor")
  const type = url.searchParams.get("type")

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/${type}?fid=${followingFid}&viewer_fid=${targetFid}&limit=100&cursor=${cursor}`, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  return Response.json({ "users": response.data.users.map((user) => (user.user)), "cursor": response.data.next.cursor })
}