import axios from "axios"

import { prisma } from '@/prisma/client'
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"

const GROUPCHAT_NAME_TO_ID = {
  "supercasters": "de8f16ad7e23cee11364d5984135abf46a99782eae5fe5b33184c0b6a4fa57e7",
  "alpha": "ecf5275b7e77a9d6603aea36362c38c4a38ccd4261e08ca868b4571807fd1cb6",
  "support": "127fd7badd507b2b6b0ea66694f4a50c00c6c92f8c9aaa2fd172ff6d0d68b6c1"
}

export async function POST(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized, error_message } = await isAuthorized(supercastUser, targetFid, false, "COMMUNITY")

  if (!authorized) {
    return Response.json({ "error": error_message }, { status: 403 })
  }

  const warpcastAPIKey = process.env.WARPCAST_DM_API_KEY

  const { groupchatName } = await req.json()

  try {
    const response = await axios.put(`https://api.warpcast.com/fc/group-invites`, {
      "groupId": GROUPCHAT_NAME_TO_ID[groupchatName],
      "invitees": [
        {
          "fid": supercastUser.fid,
          "role": "member"
        }
      ]
    }, {
      headers: {
        "Authorization": `Bearer ${warpcastAPIKey}`
      }
    })

    return Response.json({ "success": true }, { status: 200 })
  } catch (error) {
    console.log(error.response.data)
    return Response.json({ "error": error.response.data }, { status: 500 })
  }
}
