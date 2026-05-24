import axios from "axios"

import { prisma } from '@/prisma/client'
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"
import { createFarcasterAccountForPet } from "./createFarcasterAccountForPet"
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

  const { selectedPetOptionId } = await req.json()

  const selectedPetOption = await prisma.petOption.findUnique({
    where: {
      id: selectedPetOptionId,
    },
  })

  const petFarcasterAccount = await createFarcasterAccountForPet(farcasterAccount, selectedPetOption)

  // wojtek testing
  // const petFarcasterAccount = { id: "5a23399b-f5ed-42e5-ad59-b9bb443e5ae3" }

  const pet = await prisma.pet.create({
    data: {
      ownerId: farcasterAccount.id,
      farcasterAccountId: petFarcasterAccount.id,
      petOptionId: selectedPetOptionId,
    },
  })

  return Response.json({ "pet": pet })
}

export async function DELETE(req: Request) {
  // TODO make sure it only works for admins or on dev
  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { farcasterAccount, authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ "error": "Unauthorized" }, { status: 403 })
  }

  // delete the pets of this owner

  await prisma.pet.deleteMany({
    where: {
      ownerId: farcasterAccount.id,
    },
  })

  return Response.json({ "success": true })
}

