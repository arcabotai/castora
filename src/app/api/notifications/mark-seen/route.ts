import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"
import axios from "axios"

export async function POST(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, farcasterAccount, error_message } = await isAuthorized(supercastUser, targetFid, true)

  if (!authorized) {
    return Response.json({ "error": error_message }, { status: 403 })
  }

  trackPosthogEvent(supercastUser.fid, "notifications_refreshed", {
    "type": 'all',
    "asFid": targetFid
  })

  const data = {
    "signer_uuid": farcasterAccount.signerUUID,
  }

  try {
    const response = await axios.post(`https://api.neynar.com/v2/farcaster/notifications/seen`, data, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })
    return Response.json({ "casts": response.data.casts })

  } catch (error) {

    if (error.response.data.code === "SignerNotApproved") {
      return Response.json({ "error": "NO_SIGNER_APPROVED" }, { status: 403 })
    }

    return Response.json({ "error": error }, { status: error.response.status })
  }
}
