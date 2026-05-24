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

  const url = new URL(req.url)

  const address = url.searchParams.get("address")
  const season = url.searchParams.get("season")

  if (!address) {
    return Response.json({ "error": "No address provided" }, { status: 400 })
  }

  if (!season) {
    return Response.json({ "error": "No season provided" }, { status: 400 })
  }

  const lastSeason = Number(season) - 1 == 10 ? "x" : Number(season) - 1;

  const [
    responseCurrentSeasonPoints,
    responseLastSeasonPoints,
    responseAllowance,
    responseAirdropData
  ] = await Promise.all([
    axios.get(`https://api.degen.tips/airdrop2/current/points?wallet=${address}`),
    axios.get(`https://api.degen.tips/airdrop2/season${lastSeason}/points?wallet=${address}`),
    axios.get(`https://api.degen.tips/airdrop2/allowances?fid=${targetFid}`),
    axios.get(`https://api.degen.tips/airdrop2/season${lastSeason}/merkleproofs?wallet=${address}`)
  ]);

  console.log("Responses received", responseCurrentSeasonPoints.data, responseLastSeasonPoints.data, responseAllowance.data, responseAirdropData.data)

  let currentSeasonPoints = 0;
  let lastSeasonPoints = 0;
  let remainingAllowance = 0;
  let dailyAllowance = 0;
  let airdropData = null;

  if (responseCurrentSeasonPoints.status === 200 && responseCurrentSeasonPoints.data.length > 0) {
    currentSeasonPoints = responseCurrentSeasonPoints.data[0].points;
  }

  if (responseLastSeasonPoints.status === 200 && responseLastSeasonPoints.data.length > 0) {
    lastSeasonPoints = responseLastSeasonPoints.data[0].points;
  }

  if (responseAllowance.status === 200 && responseAllowance.data.length > 0) {
    remainingAllowance = responseAllowance.data[0].remaining_tip_allowance;
    dailyAllowance = responseAllowance.data[0].tip_allowance;
  }

  if (responseAirdropData.status === 200) {
    airdropData = responseAirdropData.data;
  }

  return Response.json({
    "currentSeasonPoints": currentSeasonPoints,
    "lastSeasonPoints": lastSeasonPoints,
    "remainingAllowance": remainingAllowance,
    "dailyAllowance": dailyAllowance,
    "airdropData": airdropData[0]
  })
}