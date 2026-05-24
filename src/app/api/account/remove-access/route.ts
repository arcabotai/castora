import { prisma } from "@/prisma/client"
import { SUPERANON_ADMIN_FIDS } from "@/utils/anon/admin"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"
import axios from "axios"

const canShareAccount = async (supercastUser, targetFid) => {
  // check specifically for a connectedAccount, since isAuthorized checks for a SharedAccount too

  const connectedAccount = await prisma.connectedAccount.findFirst({
    where: {
      SupercastPrivyUser: supercastUser,
      SupercastFarcasterAccount: {
        fid: targetFid
      }
    }
  });

  if (!!connectedAccount) {
    return true;
  } else {
    return false;
  }
}

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

  const isAuthorizedToShare = await canShareAccount(supercastUser, targetFid)

  if (!isAuthorizedToShare) {
    return Response.json({ "error": "NOT_AUTHORIZED_TO_SHARE" }, { status: 403 })
  }

  const { removeAccessFid } = await req.json()

  const sharedAccount = await prisma.sharedAccount.deleteMany({
    where: {
      SupercastFarcasterAccount: {
        fid: targetFid
      },
      sharedWith: {
        fid: removeAccessFid
      }
    }
  });

  trackPosthogEvent(
    supercastUser.fid,
    "account_shared_removed",
    {
      shared_with: removeAccessFid,
      fid: targetFid
    }
  )

  return Response.json({ "success": true })
}
