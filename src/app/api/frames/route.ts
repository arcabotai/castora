import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from "axios"

export async function POST(req: Request) {
  // ENDPOINT FOR SENDING A FRAME ACTION FROM THE CLIENT

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, farcasterAccount, error_message } = await isAuthorized(supercastUser, targetFid, true)

  if (!authorized) {
    return Response.json({ 'error': error_message }, { status: 403 })
  }

  const { hash, actionText, actionIndex, action_type, frameURL, postURL, userTextInput, state } = await req.json()

  const frameData = {
    "cast_hash": hash,
    "signer_uuid": farcasterAccount.signerUUID,
    "action": {
      "button": {
        "title": actionText,
        "index": actionIndex,
        "action_type": action_type,
      },
      "input": {
        "text": userTextInput,
      },
      "frames_url": frameURL,
      "post_url": postURL,
      "state": {
        "serialized": state,
      },
    }
  }

  try {
    const response = await axios.post(
      `https://api.neynar.com/v2/farcaster/frame/action/`,
      frameData,
      {
        "headers": { "x-api-key": process.env.NEYNAR_API_KEY }, maxRedirects: 0, validateStatus: function (status) {
          return status >= 200 && status < 303; // Resolve only if status code is less than 303
        }
      },
    )

    if (response.status === 302) {
      return Response.json({ "newFrame": response.headers.location })
    }

    return Response.json({ "newFrame": response.data })

  } catch (error) {

    if (error.response.data.code === "SignerNotApproved") {
      return Response.json({ "error": "NO_SIGNER_APPROVED" }, { status: 403 })
    }

    console.error(error)

    return Response.json({ "error": error }, { status: error.response.status })
  }
}
