import { prisma } from "@/prisma/client"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from "axios"

export async function POST(req: Request) {

  const { castHash } = await req.json()

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ "error": "Unauthorized" }, { status: 403 })
  }

  const bookmark = await prisma.bookmark.deleteMany({
    where: {
      ownerFid: Number(targetFid),
      castHash: castHash,
    }
  })

  return Response.json({ bookmark })
}
