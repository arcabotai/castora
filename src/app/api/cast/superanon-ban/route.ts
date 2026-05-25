import axios from "axios"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"
import { prisma } from "@/prisma/client"
import { SUPERANON_BAN_LEVEL } from "@prisma/client"
import { sendDirectCast } from "@/utils/direct-casts"
import { SUPERANON_ADMIN_FIDS } from "@/utils/anon/admin"

const SUPERANON_WARNING_MESSAGE = `
Your recent @superanon cast has been deleted and this is your first and final warning.

If we delete your cast again, you will be permanently banned from using @superanon.

Here is a reminder of the rules:

1. No token or self promotion
2. No personal attacks
3. No nsfw, spam, or other inappropriate content
4. English only
5. If you break these rules, your account will be banned from superanon

The admin team doesn't know that what you posted and you are still anonymous. This is an automated message.
`

const SUPERANON_BANNED_MESSAGE = `
Your account has been banned from superanon.

You will not be able to post on superanon anymore.

If you believe this was a mistake, please reach out in the support chat.
`

export async function POST(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  if (!SUPERANON_ADMIN_FIDS.includes(supercastUser.fid)) {
    return Response.json({ "error": "Not authorized" }, { status: 403 })
  }

  const { authorized, error_message } = await isAuthorized(supercastUser, targetFid, true)

  if (!authorized) {
    return Response.json({ "error": error_message }, { status: 403 })
  }

  const { hash } = await req.json()

  try {

    const bannedDraft = await prisma.draft.findMany({
      where: {
        castHash: hash,
      },
      include: {
        creator: true,
      },
    })

    if (bannedDraft.length === 0) {
      return Response.json({ "error": "DRAFT_NOT_FOUND" }, { status: 404 })
    }

    const superanonBan = await prisma.superanonBan.findUnique({
      where: {
        supercastPrivyUserId: bannedDraft[0].creator.id,
      },
    })

    if (!superanonBan) {
      await prisma.superanonBan.create({
        data: {
          supercastPrivyUserId: bannedDraft[0].creator.id,
          level: SUPERANON_BAN_LEVEL.WARNING,
        },
      })

      await sendDirectCast(bannedDraft[0].creator.fid, SUPERANON_WARNING_MESSAGE, "super")

    } else {
      await prisma.superanonBan.update({
        where: {
          id: superanonBan.id,
        },
        data: {
          level: SUPERANON_BAN_LEVEL.BANNED,
        },
      })

      await sendDirectCast(bannedDraft[0].creator.fid, SUPERANON_BANNED_MESSAGE, "super")
    }

    const deleteData = {
      "target_hash": hash,
      "signer_uuid": process.env.SUPERANON_SIGNER_UUID,
    }

    const response = await axios.delete(`https://api.neynar.com/v2/farcaster/cast/`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY }, data: deleteData })

    // TODO: add event for superanon ban

    trackPosthogEvent(supercastUser.fid, "cast_deleted", {
      hash: hash,
    })

    return Response.json({ "casts": response.data.casts })

  } catch (error) {

    if (error.response.data.code === "SignerNotApproved") {
      return Response.json({ "error": "NO_SIGNER_APPROVED" }, { status: 403 })
    }

    console.log(error)

    return Response.json({ "error": error }, { status: error.response.status })
  }
}
