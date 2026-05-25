import { prisma } from '@/prisma/client'
import { isAuthenticated } from '@/utils/auth/isAuthenticated'
import { isAuthorized } from '@/utils/auth/isAuthorized'
import axios from 'axios'

const prismaToList = (list: any, authorProfile: any) => {
  return {
    id: list.id,
    name: list.name,
    author: authorProfile,
    followingCount: list._count.ListFollowing,
    membershipCount: list._count.ListMembership,
    private: list.private,
  }
}

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

  const listsPrisma = await prisma.list.findMany({
    where: {
      authorFid: Number(targetFid),
    },
    select: {
      id: true,
      name: true,
      authorFid: true,
      private: true,
      ListFollowing: {
        where: {
          followerFid: Number(targetFid),
        },
      },
      ListMembership: {
        select: {
          memberFid: true,
        },
      },
      _count: {
        select: {
          ListFollowing: true,
          ListMembership: true,
        },
      },
    },
  });

  let lists = [];

  const authorFid = targetFid

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/user/bulk/?fids=${authorFid}`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

  const authorProfile = response.data.users.find((user: any) => user.fid === authorFid)

  lists = listsPrisma.map((list: any) => prismaToList(list, authorProfile))

  return Response.json({ "lists": lists })
}
