import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"
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
  const castHash = url.searchParams.get('castHash')

  if (!castHash) {
    return Response.json({ 'error': 'Missing castHash' }, { status: 400 })
  }

  trackPosthogEvent(supercastUser.fid, 'moxie_cast_stats_viewed', {
    "cast_hash": castHash,
    "asFid": targetFid,
  })

  const AIRSTACK_API_KEY = process.env.AIRSTACK_API_KEY // Make sure to set this in your environment variables

  const query = `
  query FarcasterCast($castHash: String!) {
    FarcasterCasts(
      input: {blockchain: ALL, filter: {hash: {_eq: $castHash}}, limit: 1}
    ) {
      Cast {
        hash
        castValue {
          formattedValue
        }
        moxieEarningsSplit {
          earnerType
          earningsAmount
          earningsAmountInWei
        }
      }
    }
  }
  `

  const variables = {
    "castHash": castHash
  }

  try {
    const response = await axios.post(
      'https://api.airstack.xyz/gql', // Make sure this is the correct Airstack API endpoint
      {
        query,
        variables
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': AIRSTACK_API_KEY
        }
      }
    )

    const data = response.data

    if (data.errors) {
      console.error('Airstack API error:', data.errors)
      return Response.json({ 'error': 'API Error', details: data.errors }, { status: 500 })
    }

    // Extract the relevant data from the response
    const castData = data.data.FarcasterCasts.Cast[0]

    if (!castData) {
      return Response.json({ 'error': 'No data found for this cast' }, { status: 404 })
    }

    return Response.json({
      hash: castData.hash,
      castValue: castData.castValue,
      moxieEarningsSplit: castData.moxieEarningsSplit
    })

  } catch (error) {
    console.error('Error calling Airstack API:', error.message)
    return Response.json({ 'error': 'Internal Server Error' }, { status: 500 })
  }
}