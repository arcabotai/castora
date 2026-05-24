import { isAuthenticated } from '@/utils/auth/isAuthenticated';
import axios from 'axios';

type StorageData = {
  storage_units: number;
  casts_used: number;
  casts_limit: number;
  reactions_used: number;
  reactions_limit: number;
  follows_used: number;
  follows_limit: number;
}

export async function GET(request: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(request)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const neynarUsageResponse = await axios.get(`https://api.neynar.com/v2/farcaster/storage/usage?fid=${supercastUser.fid}`, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })

  const neynarUsageData = neynarUsageResponse.data

  const storageData: StorageData = {
    storage_units: neynarUsageData.total_active_units,
    casts_used: neynarUsageData.casts.used,
    casts_limit: neynarUsageData.casts.capacity,
    reactions_used: neynarUsageData.reactions.used,
    reactions_limit: neynarUsageData.reactions.capacity,
    follows_used: neynarUsageData.links.used,
    follows_limit: neynarUsageData.links.capacity,
  }

  return Response.json(storageData)
}
