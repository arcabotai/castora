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

  const profileFid = url.searchParams.get("profileFid")

  const response = await axios.get(
    `https://api.neynar.com/v2/farcaster/followers/relevant/?target_fid=${profileFid}&viewer_fid=${targetFid}`,
    { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } }
  )

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  const fids = response.data.all_relevant_followers_dehydrated.slice(0, 100).map((follow: any) => follow.user.fid).join(",")

  const usersHydratedResponse = await axios.get(`https://api.neynar.com/v2/farcaster/user/bulk/?fids=${fids}`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

  if (usersHydratedResponse.status !== 200) {
    return Response.json(usersHydratedResponse.data, { status: usersHydratedResponse.status })
  }

  return Response.json({ "users": usersHydratedResponse.data.users, "cursor": null })
}