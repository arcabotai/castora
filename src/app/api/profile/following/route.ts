import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from "axios"
import { neynar } from '@/lib/neynar'

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
  const followEndpoint = type === "followers" ? "followers" : "following"

  const response = await neynar.get(`/v2/farcaster/${followEndpoint}/?fid=${followingFid}&viewer_fid=${targetFid}&limit=100&cursor=${cursor}`)

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  return Response.json({ "users": response.data.users.map((user) => (user.user)), "cursor": response.data.next.cursor })
}