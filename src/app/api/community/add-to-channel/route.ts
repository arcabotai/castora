import axios from "axios"

import { prisma } from '@/prisma/client'
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"
import { addToChannel } from "@/utils/members"

export async function POST(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { farcasterAccount, authorized, error_message } = await isAuthorized(supercastUser, targetFid, false, "COMMUNITY")

  if (!authorized) {
    return Response.json({ "error": error_message }, { status: 403 })
  }

  if (targetFid !== supercastUser.fid) {
    return Response.json({ "error": "Only your main account can join the community channel" }, { status: 403 })
  }

  try {
    await addToChannel(farcasterAccount, "super")

    return Response.json({ "success": true }, { status: 200 })
  } catch (error) {
    console.log(error.response.data)
    return Response.json({ "error": error.response.data }, { status: 500 })
  }
}
