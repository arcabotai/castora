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

  const AIRSTACK_MOXIE_CLAIM_API_KEY = process.env.AIRSTACK_MOXIE_CLAIM_API_KEY

  const query = `
    query FarcasterUserClaimTransactionDetails($fid: Int!) {
      FarcasterUserClaimTransactionDetails(input: { fid: $fid }) {
        fid
        availableClaimAmount
        minimumClaimableAmountInWei
        availableClaimAmountInWei
        claimedAmount
        claimedAmountInWei
        processingAmount
        processingAmountInWei
      }
    }
  `

  const variables = {
    fid: targetFid // Use the targetFid from the request header
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

    return Response.json({
      availableClaimAmount: data.data.FarcasterUserClaimTransactionDetails.availableClaimAmount
    })
  } catch (error) {
    console.error('Error calling Airstack API:', error.message)
    return Response.json({ 'error': 'Internal Server Error' }, { status: 500 })
  }
}

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

  // Parse the request body to get preferredConnectedWallet
  const { address } = await req.json()

  if (!address) {
    return Response.json({ 'error': 'Missing address in request body' }, { status: 400 })
  }

  const mutation = `
    mutation FarcasterUserClaimMoxie($fid: Int!, $preferredConnectedWallet: String!) {
      FarcasterUserClaimMoxie(
        input: { fid: $fid, preferredConnectedWallet: $preferredConnectedWallet }
      ) {
        fid
        availableClaimAmount
        minimumClaimableAmountInWei
        availableClaimAmountInWei
        claimedAmount
        claimedAmountInWei
        processingAmount
        processingAmountInWei
        tokenAddress
        chainId
        transactionId
        transactionStatus
        transactionAmount
        transactionAmountInWei
        rewardsLastEarnedTimestamp
      }
    }
  `

  const variables = {
    fid: targetFid,
    preferredConnectedWallet: address
  }

  const AIRSTACK_MOXIE_CLAIM_API_KEY = process.env.AIRSTACK_MOXIE_CLAIM_API_KEY

  trackPosthogEvent(supercastUser.fid, "moxie_daily_reward_request", {
    "asFid": targetFid,
    "address": address
  })

  try {
    const response = await axios.post(
      'https://claims.airstack.xyz/moxie',
      { query: mutation, variables },
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

    console.log('Airstack API response:', data.data.FarcasterUserClaimMoxie)

    return Response.json({
      transactionId: data.data.FarcasterUserClaimMoxie.transactionId,
    })
  } catch (error) {
    console.error('Error calling Airstack API:', error)
    return Response.json({ 'error': 'Internal Server Error' }, { status: 500 })
  }
}