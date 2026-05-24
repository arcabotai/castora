import { prisma } from "@/prisma/client";
import { isAuthenticated } from "@/utils/auth/isAuthenticated";
import axios from "axios";

export async function POST(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  if (!!supercastUser.fid) {
    // TODO test if this never ever goes past this check for a user with fid
    return Response.json({ "fid": supercastUser.fid });
  }

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/user/fid`, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  const newFid = response.data.fid;

  return Response.json({ "fid": newFid });
}