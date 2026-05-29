import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from "axios"
import { neynar } from '@/lib/neynar'

export async function GET(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, error_message } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ "error": error_message }, { status: 403 })
  }

  const url = new URL(req.url)
  const cursor = url.searchParams.get('cursor')

  const response = await neynar.get(`/v2/farcaster/followers/?fid=${targetFid}&viewer_fid=${targetFid}&sort_type=algorithmic&cursor=${cursor}&limit=20`)

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  return Response.json({ "users": response.data.users, "cursor": response.data.next.cursor })
}


