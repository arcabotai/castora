import axios from "axios"

import { prisma } from '@/prisma/client'
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"
import { WAITLIST_STATUS, WAITLIST_TYPE } from "@prisma/client"

export const maxDuration = 120

export async function POST(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { farcasterAccount, authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ "error": "Unauthorized" }, { status: 403 })
  }

  const { type } = await req.json()

  const waitlist = await prisma.waitlist.create({
    data: {
      supercastFarcasterAccountId: farcasterAccount.id,
      type,
    },
  })

  trackPosthogEvent(farcasterAccount.fid, "waitlist_signup", {
    "waitlist_type": type,
  })

  return Response.json({ "waitlist": waitlist })
}

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

  const url = new URL(req.url)
  const waitlistType = url.searchParams.get("type")

  const waitlistEntry = await prisma.waitlist.findUnique({
    where: {
      supercastFarcasterAccountId_type: {
        supercastFarcasterAccountId: farcasterAccount.id,
        type: waitlistType as WAITLIST_TYPE,
      },
    },
  })

  return Response.json({
    "in_waitlist": !!waitlistEntry,
    "status": waitlistEntry?.status,
  })
}


