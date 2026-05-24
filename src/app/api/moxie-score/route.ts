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
  const userId = url.searchParams.get('userId')

  if (!userId) {
    return Response.json({ 'error': 'Missing userId' }, { status: 400 })
  }

  const AIRSTACK_API_KEY = process.env.AIRSTACK_API_KEY // Make sure to set this in your environment variables

  const query = `
  query FarcasterScore($userId: String!) {
    Socials(input: {filter: {userId: {_eq: $userId}}, blockchain: ethereum}) {
      Social {
        profileName
        farcasterScore {
          farRank
          farScore
          farBoost
          farScoreRaw
          tvl
          tvlBoost
        }
      }
    }
  }
  `

  const variables = {
    "userId": userId
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
    const farcasterData = data.data.Socials.Social[0]

    if (!farcasterData) {
      return Response.json({ 'error': 'No data found for this user' }, { status: 404 })
    }

    return Response.json({
      profileName: farcasterData.profileName,
      farcasterScore: farcasterData.farcasterScore
    })

  } catch (error) {
    console.error('Error calling Airstack API:', error.message)
    return Response.json({ 'error': 'Internal Server Error' }, { status: 500 })
  }
}