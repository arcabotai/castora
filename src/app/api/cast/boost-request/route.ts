import axios from "axios"

import { v4 as uuidv4 } from 'uuid';
import { prisma } from "@/prisma/client";
import { OPT_OUT_TYPE } from "@prisma/client";
import { HOST_URL } from "@/utils/hostURL";
import { isAuthenticated } from "@/utils/auth/isAuthenticated";
import { isAuthorized } from "@/utils/auth/isAuthorized";
import { trackPosthogEvent } from "@/utils/posthogAnalytics";

export async function POST(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  const { hash, recipientFids } = await req.json()

  if (!hash) {
    return Response.json({ "error": "hash is required" }, { status: 400 })
  }

  if (!recipientFids) {
    return Response.json({ "error": "recipientFids is required" }, { status: 400 })
  }

  if (recipientFids.length > 20) {
    return Response.json({ "error": "recipientFids cannot exceed 20" }, { status: 400 })
  }

  const fidsLookupString = [targetFid, ...recipientFids].join(',')

  const userDataResponse = await axios.get(`https://api.neynar.com/v2/farcaster/user/bulk/?fids=${fidsLookupString}&viewer_fid=${targetFid}`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

  const username = userDataResponse.data.users[0].username

  // find all recipients that are not following the sender. if there is more than 0, return an error
  const recipientProfiles = userDataResponse.data.users.slice(1)
  const nonFollowers = recipientProfiles.filter(profile => !profile.viewer_context.followed_by)

  if (nonFollowers.length > 0) {
    return Response.json({ "error": "Some recipients are not following you" }, { status: 400 })
  }

  const mostRecentBoostRequest = await prisma.boostRequest.findFirst({
    where: {
      authorFid: Number(targetFid),
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // if the most recent boost request is less than 24 hours old, return an error
  if (mostRecentBoostRequest && new Date().getTime() - mostRecentBoostRequest.createdAt.getTime() < 86400000) {
    return Response.json({ "error": "You can only send one boost request per day" }, { status: 400 })
  }

  const sendDirectCast = async (recipientFid: number, boostRquestId: string, username: string, hash: string) => {

    const transformedFid = ((Number(recipientFid) + 2) * 3 - 7) * 2

    const message = `Hey, it's @${username} via super!
I would appreciate your support in boosting this casts's engagement.
Here's the link: https://warpcast.com/${username}/${hash.slice(0, 10)}. Thanks!

If you don't want to participate in boost requests, please opt out here: ${HOST_URL}/dc-opt-out/${boostRquestId}-${transformedFid}.
  `

    // check if this user opted out of receiving boost requests, either globally or specifically to this author fid
    const recipientOptOut = await prisma.boostRequestOptOut.findFirst({
      where: {
        userFid: Number(recipientFid),
        OR: [
          { type: OPT_OUT_TYPE.GLOBAL },
          {
            type: OPT_OUT_TYPE.PERSONAL,
            targetFid: Number(targetFid)
          }
        ]
      }
    })

    if (recipientOptOut) {
      return { data: { "status": "skipped", "recipientFid": recipientFid, "reason": "opted out" } }
    }

    return await axios.put("https://api.warpcast.com/v2/ext-send-direct-cast", {
      "recipientFid": recipientFid,
      "message": message,
      "idempotencyKey": uuidv4()
    },
      {
        headers: {
          "Authorization": `Bearer ${process.env.WARPCAST_DM_API_KEY}`
        }
      }
    )
  }

  const newBoostRequest = await prisma.boostRequest.create({
    data: {
      authorFid: Number(targetFid),
      recipientFids: recipientFids,
      castHash: hash,
    }
  })

  trackPosthogEvent(
    supercastUser.fid,
    "boost_request_sent",
    {
      "asFid": targetFid,
      "castHash": hash,
    }
  )

  const recipientsAndAuthorFids = [targetFid, ...recipientFids]

  try {
    const responses = await Promise.all(recipientsAndAuthorFids.map((fid) => sendDirectCast(fid, newBoostRequest.id, username, hash)))
    return new Response(JSON.stringify({ "status": "success", "details": responses.map(res => res.data) }), { status: 200 });
  } catch (error) {
    console.error("Failed to send direct casts:", error);
    return new Response(JSON.stringify({ "error": "Failed to send messages" }), { status: 500 });
  }
}
