import { prisma } from "@/prisma/client";
import { isAuthenticated } from "@/utils/auth/isAuthenticated";
import { isAuthorized } from "@/utils/auth/isAuthorized";
import { trackPosthogEvent } from "@/utils/posthogAnalytics";
import axios from "axios";

export async function DELETE(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  const { removeFid } = await req.json()

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, error_message } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ "error": error_message }, { status: 403 })
  }

  await prisma.connectedAccount.deleteMany({
    where: {
      supercastPrivyUserId: supercastUser.id,
      SupercastFarcasterAccount: {
        fid: removeFid
      }
    }
  })

  trackPosthogEvent(supercastUser.fid, "account_disconnected", {})

  return Response.json({ "success": true });
}