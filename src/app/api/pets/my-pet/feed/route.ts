import axios from "axios"

import { prisma } from '@/prisma/client'
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"
import { FEED_POINTS } from "@/utils/petConfig"

export async function PUT(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { farcasterAccount, authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ "error": "Unauthorized" }, { status: 403 })
  }

  const pet = await prisma.pet.updateMany({
    where: {
      ownerId: farcasterAccount.id,
    },
    data: {
      happiness: { increment: FEED_POINTS },
      lastFedAt: new Date(),
    },
  })

  if (!pet) {
    return Response.json({ "error": "No pet found" }, { status: 404 })
  }

  return Response.json({ "pet": pet })
}