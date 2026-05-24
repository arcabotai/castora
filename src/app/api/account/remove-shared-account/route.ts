import { prisma } from "@/prisma/client"
import { SUPERANON_ADMIN_FIDS } from "@/utils/anon/admin"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"
import axios from "axios"

export async function DELETE(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const isSuperanonNonAdmin = targetFid === Number(process.env.NEXT_PUBLIC_SUPERANON_FID) && !SUPERANON_ADMIN_FIDS.includes(supercastUser.fid)

  if (isSuperanonNonAdmin) {
    return Response.json({ "error": "Not authorized" }, { status: 403 })
  }

  const { authorized, error_message } = await isAuthorized(supercastUser, targetFid, true)

  if (!authorized) {
    return Response.json({ "error": error_message }, { status: 403 })
  }

  const { removeAccessFid } = await req.json()

  const sharedAccount = await prisma.sharedAccount.deleteMany({
    where: {
      sharedWith: {
        fid: targetFid
      },
      SupercastFarcasterAccount: {
        fid: removeAccessFid
      }
    }
  });

  trackPosthogEvent(
    supercastUser.fid,
    "account_shared_removed",
    {
      shared_with: targetFid,
      fid: removeAccessFid
    }
  )

  return Response.json({ "success": true })
}
