import { prisma } from "@/prisma/client";
import { isAuthenticated } from "@/utils/auth/isAuthenticated";
import { isAuthorized } from "@/utils/auth/isAuthorized";
import axios from "axios";

export async function POST(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, error_message } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ "error": error_message }, { status: 403 })
  }

  const connectionSession = await prisma.accountConnectionSession.create({
    data: {
      supercastPrivyUserId: supercastUser.id,
    }
  })

  return Response.json({ "connectionSession": connectionSession.id });
}