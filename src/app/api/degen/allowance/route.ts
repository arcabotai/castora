import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from "axios"

export async function GET(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  if (!Number.isInteger(targetFid) || targetFid <= 0) {
    return Response.json({ 'error': 'Invalid target fid' }, { status: 400 })
  }

  const { authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  let response;

  try {
    response = await axios.get(
      `https://api.degen.tips/airdrop2/allowances?fid=${targetFid}`,
      {
        timeout: 5000,
        validateStatus: () => true,
      },
    );
  } catch (error) {
    console.warn('/api/degen/allowance upstream failed', {
      code: axios.isAxiosError(error) ? error.code : undefined,
      fid: targetFid,
    })
    return Response.json({ "allowance": 0 })
  }

  if (response.status !== 200) {
    console.warn('/api/degen/allowance upstream failed', {
      status: response.status,
      fid: targetFid,
    })
    return Response.json({ "allowance": 0 })
  }

  if (response.data.length === 0) {
    return Response.json({ "allowance": 0 })
  }

  return Response.json({ "allowance": response.data[0].remaining_tip_allowance })
}
