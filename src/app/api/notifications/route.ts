import axios from "axios"
import { neynar } from '@/lib/neynar'

import { prisma } from '@/prisma/client'
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { withAuthInfra } from "@/utils/auth/authInfraResponse"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"

// Surface a transient DB/Privy auth outage as a retryable 503, not a false 401.
export const GET = withAuthInfra(async (req: Request) => {

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
    response = await neynar.get(`/v2/farcaster/notifications/?fid=${targetFid}&priority_mode=${priority}&cursor=${cursor}`)
  } else if (mode === "mentions") {
    response = await neynar.get(`/v2/farcaster/notifications/?fid=${targetFid}&type=mentions,replies&priority_mode=${priority}&cursor=${cursor}`)
  }

  return Response.json({ "unread": response.data.unseen_notifications_count, "notifications": response.data.notifications, "cursor": response.data.next.cursor })
})