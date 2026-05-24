import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from "axios"

export async function GET(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  const response = await axios.get(`https://api.degen.tips/airdrop2/allowances?fid=${targetFid}`);

  if (response.status !== 200) {
    return Response.json({ "allowance": 0 })
  }

  if (response.data.length === 0) {
    return Response.json({ "allowance": 0 })
  }

  return Response.json({ "allowance": response.data[0].remaining_tip_allowance })
}
