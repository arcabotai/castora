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
  const addresses = url.searchParams.get('addresses').split(',')

  if (!addresses || addresses.length === 0) {
    return Response.json({ 'error': 'Missing addresses' }, { status: 400 })
  }

  const AIRSTACK_API_KEY = process.env.AIRSTACK_API_KEY // Make sure to set this in your environment variables

  const query = `
  query MyQuery($userAddresses: [ID!]) {
    users(where: {id_in: $userAddresses}) {
      portfolio {
        balance
        buyVolume
        sellVolume
        subjectToken {
          name
          symbol
          currentPriceInMoxie
        }
      }
    }
  }
  `

  const variables = {
    "userAddresses": addresses
  }

  try {
    const response = await axios.post(
      'https://api.studio.thegraph.com/query/23537/moxie_protocol_stats_mainnet/version/latest',
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
      console.error('Airstack API error:', data.errors)
      return Response.json({ 'error': 'API Error', details: data.errors }, { status: 500 })
    }

    let totalValue = 0

    for (const user of data.data.users) {
      for (const token of user.portfolio) {
        totalValue += token.balance / 10 ** 18 * token.subjectToken.currentPriceInMoxie
      }
    }

    return Response.json({ "totalValue": totalValue })
  } catch (error) {
    console.error('Error calling Airstack API:', error.message)
    return Response.json({ 'error': 'Internal Server Error' }, { status: 500 })
  }
}
