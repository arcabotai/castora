import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"
import axios from "axios"
import { neynar } from '@/lib/neynar'

export async function POST(req: Request) {

  const { hash } = await req.json()

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, farcasterAccount, error_message } = await isAuthorized(supercastUser, targetFid, true)

  if (!authorized) {
    return Response.json({ "error": error_message }, { status: 403 })
  }

  const reactionData = {
    "reaction_type": "like",
    "target": hash,
    "signer_uuid": farcasterAccount.signerUUID,
  }

  trackPosthogEvent(supercastUser.fid, "cast_liked", {
    "asFid": targetFid,
    "target": hash
  })

  try {
    const response = await neynar.post(`/v2/farcaster/reaction/`, reactionData)
    return Response.json({ "casts": response.data.casts })

  } catch (error) {

    if (error.response.data.code === "SignerNotApproved") {
      return Response.json({ "error": "NO_SIGNER_APPROVED" }, { status: 403 })
    }

    return Response.json({ "error": error }, { status: error.response.status })
  }
}
