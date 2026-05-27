import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from "axios"

type DegenResponse = { status: number, data: any }

const fetchDegen = async (url: string): Promise<DegenResponse> => {
  try {
    return await axios.get(url, {
      timeout: 5000,
      validateStatus: () => true,
    })
  } catch (error) {
    console.warn('/api/degen/widget-data upstream request failed', {
      code: axios.isAxiosError(error) ? error.code : undefined,
      url: url.replace(/wallet=[^&]+/, 'wallet=<redacted>'),
    })
    return { status: 0, data: [] }
  }
}

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
  const encodedAddress = encodeURIComponent(address)

  const [
    responseCurrentSeasonPoints,
    responseLastSeasonPoints,
    responseAllowance,
    responseAirdropData
  ] = await Promise.all([
    fetchDegen(`https://api.degen.tips/airdrop2/current/points?wallet=${encodedAddress}`),
    fetchDegen(`https://api.degen.tips/airdrop2/season${lastSeason}/points?wallet=${encodedAddress}`),
    fetchDegen(`https://api.degen.tips/airdrop2/allowances?fid=${targetFid}`),
    fetchDegen(`https://api.degen.tips/airdrop2/season${lastSeason}/merkleproofs?wallet=${encodedAddress}`)
  ]);

  const degenResponses = [
    ['currentPoints', responseCurrentSeasonPoints],
    ['lastSeasonPoints', responseLastSeasonPoints],
    ['allowance', responseAllowance],
    ['airdropData', responseAirdropData],
  ] as Array<[string, DegenResponse]>

  const failedResponses = degenResponses.filter(([, response]) => response.status !== 200)

  if (failedResponses.length > 0) {
    console.warn('/api/degen/widget-data upstream partial failure', {
      targetFid,
      failures: failedResponses.map(([name, response]) => ({ name, status: response.status })),
    })
  }

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
    "airdropData": Array.isArray(airdropData) ? airdropData[0] : null
  })
}
