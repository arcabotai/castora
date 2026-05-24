import { prisma } from '@/prisma/client'
import { isAuthenticated } from '@/utils/auth/isAuthenticated'
import { isAuthorized } from '@/utils/auth/isAuthorized'
import axios from 'axios'
import { NextRequest } from 'next/server'

const prismaToList = (list: any, followedLists: string[], authorProfiles: any[]) => {
  return {
    id: list.id,
    name: list.name,
    author: authorProfiles.find(profile => profile.fid === list.authorFid),
    followingCount: list._count.ListFollowing,
    membershipCount: list._count.ListMembership,
    followingStatus: followedLists.includes(list.id),
  }
}

export async function GET(req: NextRequest) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const skip = (page - 1) * limit

  const listsPrisma = await prisma.list.findMany({
    where: {
      AND: {
        type: "USERS",
        private: false,
      },
    },
    select: {
      id: true,
      name: true,
      authorFid: true,
      ListFollowing: {
        where: {
          followerFid: Number(targetFid),
        },
      },
      _count: {
        select: {
          ListFollowing: true,
          ListMembership: true,
        },
      },
    },
    orderBy: {
      ListFollowing: {
        _count: 'desc',
      },
    },
    skip,
    take: limit,
  });

  const totalCount = await prisma.list.count({
    where: {
      AND: {
        type: "USERS",
        private: false,
      },
    },
  });

  const followedListsPrisma = await prisma.listFollowing.findMany({
    where: {
      followerFid: Number(targetFid),
    },
    select: {
      listId: true,
    },
  });

  const followedLists = followedListsPrisma.map(list => list.listId)

  const authorFids = listsPrisma.map(list => list.authorFid).join(",")

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${authorFids}`, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })

  const authorProfiles = response.data.users

  let lists = listsPrisma.map(lists => prismaToList(lists, followedLists, authorProfiles))

  return Response.json({
    lists,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    }
  })
}

