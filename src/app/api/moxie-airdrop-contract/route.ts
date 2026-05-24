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
  const address = url.searchParams.get('address')

  if (!address) {
    return Response.json({ 'error': 'Missing address' }, { status: 400 })
  }

  const AIRSTACK_API_KEY = process.env.AIRSTACK_API_KEY // Make sure to set this in your environment variables

  const query = `
  query MyQuery($beneficiary: Bytes) {
    tokenLockWallets(where: {beneficiary: $beneficiary}) {
      address: id
    }
  }
  `

  const variables = {
    "beneficiary": address
  }

  try {
    const response = await axios.post(
      'https://api.studio.thegraph.com/query/23537/moxie_vesting_mainnet/version/latest',
      {
        query,
        variables
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-airstack-claims': AIRSTACK_API_KEY
        }
      }
    )

    const data = response.data

    if (data.errors) {
      return Response.json({ 'error': 'API Error', details: data.errors }, { status: 500 })
    }

    if (data.data.tokenLockWallets.length === 0) {
      return Response.json({ "address": "0x0" })
    }

    return Response.json({ "address": data.data.tokenLockWallets[0].address })
  } catch (error) {
    console.error('Error calling Airstack API:', error.message)
    return Response.json({ 'error': 'Internal Server Error' }, { status: 500 })
  }
}
