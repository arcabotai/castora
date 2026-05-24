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
  const transactionId = url.searchParams.get('transactionId')

  if (!transactionId) {
    return Response.json({ 'error': 'Missing transactionId' }, { status: 400 })
  }

  const AIRSTACK_MOXIE_CLAIM_API_KEY = process.env.AIRSTACK_MOXIE_CLAIM_API_KEY // Make sure to set this in your environment variables

  const query = `
    query FarcasterUserClaimTransactionDetails(
      $fid: Int!
      $transactionId: String
    ) {
      FarcasterUserClaimTransactionDetails(
        input: { fid: $fid, transactionId: $transactionId }
      ) {
        transactionId
        transactionStatus
        transactionAmount
        transactionAmountInWei
        rewardsLastEarnedTimestamp
      }
    }
  `

  const variables = {
    fid: targetFid, // Use the targetFid from the request header
    transactionId: transactionId
  }

  try {
    const response = await axios.post(
      'https://claims.airstack.xyz/moxie',
      {
        query,
        variables
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-airstack-claims': AIRSTACK_MOXIE_CLAIM_API_KEY
        }
      }
    )

    const data = response.data

    if (data.errors) {
      return Response.json({ 'error': 'API Error', details: data.errors }, { status: 500 })
    }

    console.log('Airstack API response:', data.data.FarcasterUserClaimTransactionDetails.transactionStatus)

    return Response.json({
      transactionStatus: data.data.FarcasterUserClaimTransactionDetails.transactionStatus,
    })
  } catch (error) {
    console.error('Error calling Airstack API:', error.message)
    return Response.json({ 'error': 'Internal Server Error' }, { status: 500 })
  }
}

