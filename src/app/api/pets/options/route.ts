import axios from "axios"

import { prisma } from '@/prisma/client'
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { generatePetOptions } from "./generatePetOptions"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"
import { WAITLIST_TYPE } from "@prisma/client"

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

  const waitlistEntry = await prisma.waitlist.findUnique({
    where: {
      supercastFarcasterAccountId_type: {
        supercastFarcasterAccountId: farcasterAccount.id,
        type: WAITLIST_TYPE.PETS,
      },
    },
  })

  if (!waitlistEntry || waitlistEntry.status !== "APPROVED") {
    return Response.json({ "error": "Not approved for pets feature" }, { status: 403 })
  }

  const petOptions = await generatePetOptions(farcasterAccount)

  return Response.json({ "petOptions": petOptions })
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

  const petOptions = await prisma.petOption.findMany({
    where: {
      ownerId: farcasterAccount.id,
    },
  })

  return Response.json({ "petOptions": petOptions })
}