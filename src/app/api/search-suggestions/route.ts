import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from "axios"
import { neynar } from '@/lib/neynar'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid")) || Number(process.env.DEFAULT_GUEST_USER_FID)

  const { authorized } = await isAuthorized(supercastUser, targetFid, false, null, "READ_SEARCH")

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  const url = new URL(req.url)

  const query = url.searchParams.get("query").replace("@", "").replace("/", "")

  const [channelResponse, profileResponse] = await Promise.all([
    neynar.get(`/v2/farcaster/channel/search/?q=${query}`),
    neynar.get(`/v2/farcaster/user/search/?viewer_fid=${targetFid}&q=${query}`)
  ]);

  if (channelResponse.status !== 200 || profileResponse.status !== 200) {
    const errorStatus = channelResponse.status !== 200 ? channelResponse.status : profileResponse.status;
    const errorMessage = channelResponse.status !== 200 ? channelResponse.data : profileResponse.data;
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }

  if (!channelResponse.data.channels || !profileResponse.data.result?.users) {
    return NextResponse.json({ error: 'Invalid response from Neynar API' }, { status: 500 });
  }

  return Response.json({
    channels: channelResponse.data.channels.slice(0, 3),
    users: profileResponse.data.result.users.slice(0, 3)
  })
}