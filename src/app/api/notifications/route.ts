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

  const { authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ "error": "Unauthorized" }, { status: 403 })
  }

  const url = new URL(req.url)

  const cursor = url.searchParams.get("cursor")
  const mode = url.searchParams.get("mode")
  const priority = url.searchParams.get("priority")

  let response;

  if (mode === "all") {
    response = await axios.get(`https://api.neynar.com/v2/farcaster/notifications/?fid=${targetFid}&priority_mode=${priority}&cursor=${cursor}`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })
  } else if (mode === "mentions") {
    response = await axios.get(`https://api.neynar.com/v2/farcaster/notifications/?fid=${targetFid}&type=mentions,replies&priority_mode=${priority}&cursor=${cursor}`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })
  }

  return Response.json({ "unread": response.data.unseen_notifications_count, "notifications": response.data.notifications, "cursor": response.data.next.cursor })
}