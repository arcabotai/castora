import axios from "axios"

import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"

const getReplies = (currentCast) => {
  let replies = []
  const topLevelReplies = currentCast.direct_replies

  for (const reply of topLevelReplies) {
    const replyAuthorAnswer = reply.direct_replies.find((cast: any) => cast.author.fid === currentCast.author.fid)
    if (replyAuthorAnswer) {
      replies.push([reply, replyAuthorAnswer])
    } else {
      replies.push([reply])
    }
  }

  return replies
}

export const maxDuration = 240;

export async function GET(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid")) || 0

  const { authorized, error_message } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ "error": error_message }, { status: 403 })
  }

  const url = new URL(req.url)

  const hash = url.searchParams.get("hash")

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/cast/conversation/?identifier=${hash}&type=hash&reply_depth=5&sort_type=algorithmic&fold=below&include_chronological_parent_casts=true${!!targetFid ? `&viewer_fid=${targetFid}` : ""}&limit=50`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  let replies = getReplies(response.data.conversation.cast)

  return Response.json({ "replies": replies })
}
