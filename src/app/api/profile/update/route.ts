import axios from "axios"

import { prisma } from "@/prisma/client";
import { isAuthenticated } from "@/utils/auth/isAuthenticated";
import { isAuthorized } from "@/utils/auth/isAuthorized";
import { SUPERANON_ADMIN_FIDS } from "@/utils/anon/admin";

export async function PATCH(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const isSuperanonNonAdmin = targetFid === Number(process.env.NEXT_PUBLIC_SUPERANON_FID) && !SUPERANON_ADMIN_FIDS.includes(supercastUser.fid)

  if (isSuperanonNonAdmin) {
    return Response.json({ "error": "Not authorized" }, { status: 403 })
  }

  const { authorized, farcasterAccount, error_message } = await isAuthorized(supercastUser, targetFid, true)

  if (!authorized) {
    return Response.json({ "error": error_message }, { status: 403 })
  }

  const { display_name, pfp_url, bio, location } = await req.json()

  const updateData = {
    display_name,
    pfp_url,
    bio,
    ...(location && {
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      }
    }),
    signer_uuid: farcasterAccount.signerUUID,
  }

  try {
    const response = await axios.patch(`https://api.neynar.com/v2/farcaster/user`, updateData, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })
    return Response.json({ "user": response.data })

  } catch (error) {

    if (error.response.data.code === "SignerNotApproved") {
      return Response.json({ "error": "NO_SIGNER_APPROVED" }, { status: 403 })
    }

    return Response.json({ "error": error }, { status: error.response.status })
  }
}