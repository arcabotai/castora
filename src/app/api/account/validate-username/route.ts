import { isAuthenticated } from "@/utils/auth/isAuthenticated";
import axios from "axios";

export async function GET(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const url = new URL(req.url);
  const username = url.searchParams.get("username");

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/fname/availability?fname=${username}`, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  return Response.json({ "isAvailable": response.data.available });
}