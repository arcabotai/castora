import { SUPERANON_ADMIN_FIDS } from "@/utils/anon/admin"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from "axios"
import { neynar } from '@/lib/neynar'

export async function POST(req: Request) {

  const { followedFid } = await req.json()

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

  const followData = {
    "target_fids": [
      followedFid
    ],
    "signer_uuid": farcasterAccount.signerUUID,
  }

  try {
    const response = await neynar.post(`/v2/farcaster/user/follow/`, followData)
    return Response.json({ "result": response.data })

  } catch (error) {

    if (error.response.data.code === "SignerNotApproved") {
      return Response.json({ "error": "NO_SIGNER_APPROVED" }, { status: 403 })
    }

    return Response.json({ "error": error }, { status: error.response.status })
  }
}
