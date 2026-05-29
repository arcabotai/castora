import axios from "axios"
import { neynar } from '@/lib/neynar'

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

  const pet = await prisma.pet.findFirst({
    where: {
      ownerId: farcasterAccount.id,
    },
    include: {
      farcasterAccount: true,
    },
  })

  if (!pet) {
    // if (true) {

    const petOptions = await prisma.petOption.findMany({
      where: {
        ownerId: farcasterAccount.id,
      },
    })

    if (petOptions.length === 0) {
      // if (true) {
      console.log("No pet options found")
      return Response.json({ "pet": null, "petOptions": [] }, { status: 200 })
    }

    console.log("Pet options found", petOptions)
    return Response.json({ "pet": null, "petOptions": petOptions }, { status: 200 })
  }

  const petProfileResponse = await neynar.get(`/v2/farcaster/user/bulk/?fids=${pet.farcasterAccount.fid}`)

  const petFarcasterData = petProfileResponse.data.users[0]
  const petStats = {
    happiness: pet.happiness,
    lastFedAt: pet.lastFedAt,
    lastPlayedAt: pet.lastPlayedAt,
  }
  const petOption = await prisma.petOption.findUnique({
    where: {
      id: pet.petOptionId,
    },
  })

  console.log("Pet found", { ...petFarcasterData, ...petStats, petOption })
  return Response.json({ "pet": { ...petFarcasterData, ...petStats, petOption }, "petOptions": [] })
}