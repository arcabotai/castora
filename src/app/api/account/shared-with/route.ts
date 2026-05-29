import { prisma } from "@/prisma/client"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from "axios"
import { neynar } from '@/lib/neynar'

export async function GET(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, error_message } = await isAuthorized(supercastUser, targetFid, true)

  if (!authorized) {
    return Response.json({ "error": error_message }, { status: 403 })
  }

  const sharedAccounts = await prisma.sharedAccount.findMany({
    where: {
      SupercastFarcasterAccount: {
        fid: targetFid
      }
    },
    include: {
      sharedWith: true
    }
  })

  const sharedWithFids = sharedAccounts.map((sa) => sa.sharedWith.fid)

  if (sharedWithFids.length > 0) {
    const response = await neynar.get(`/v2/farcaster/user/bulk/?fids=${sharedWithFids}&viewer_fid=${targetFid}`)

    if (response.status !== 200) {
      return Response.json(response.data, { status: response.status })
    }

    return Response.json({ "users": response.data.users })
  }

  return Response.json({ "users": [] })
}
