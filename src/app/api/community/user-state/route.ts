import axios from "axios"

import { prisma } from '@/prisma/client'
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"

export async function GET(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { farcasterAccount, authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ "error": "Unauthorized" }, { status: 403 })
  }

  const supercastFid = 193137

  // check follow supercast status
  const followingResponse = await axios.get(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${supercastUser.fid}&viewer_fid=${supercastFid}`, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })
  const following = followingResponse.data.users[0].viewer_context.followed_by

  const groupchatMember = false // TODO remove this and read from warpcast api

  // check channel status

  const channelMemberResponse = await axios.get(`https://api.neynar.com/v2/farcaster/channel?id=super&type=id&viewer_fid=${supercastUser.fid}`, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })
  const channelMember = !!channelMemberResponse.data.channel.viewer_context.role

  return Response.json({ "following": following, "groupchatMember": groupchatMember, "channelMember": channelMember }, { status: 200 })
}
