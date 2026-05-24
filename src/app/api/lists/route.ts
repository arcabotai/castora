import { prisma } from '@/prisma/client'
import { isAuthenticated } from '@/utils/auth/isAuthenticated'
import { isAuthorized } from '@/utils/auth/isAuthorized'
import { trackPosthogEvent } from '@/utils/posthogAnalytics'
import { EVENT_TYPE } from '@prisma/client'

const prismaToList = (list: any) => {
  return {
    id: list.id,
    name: list.name,
    authorFid: list.authorFid,
    followingCount: list._count.ListFollowing,
    membershipCount: list._count.ListMembership,
    private: list.private,
  }
}

const prismaToListWithMembership = (list: any, fid: number) => {
  return {
    id: list.id,
    name: list.name,
    authorFid: list.authorFid,
    followingCount: list._count.ListFollowing,
    membershipCount: list._count.ListMembership,
    isMember: list.ListMembership.some((membership: any) => membership.memberFid === fid),
    private: list.private,
  }
}

export async function GET(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid")) || Number(process.env.DEFAULT_GUEST_USER_FID)

  const { authorized } = await isAuthorized(supercastUser, targetFid, false, null, "READ_LISTS")

  if (!authorized) {
    return Response.json({ "error": "Unauthorized" }, { status: 403 })
  }

  const url = new URL(req.url)
  const isMember = url.searchParams.get("isMember")

  const listsPrisma = await prisma.list.findMany({
    where: {
      // Use OR condition to get lists followed or owned by the user
      OR: [
        {
          ListFollowing: {
            some: {
              followerFid: Number(targetFid),
            },
          },
        },
        {
          authorFid: Number(targetFid),
        },
      ],
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

  if (!!isMember) {
    lists = listsPrisma.map((list: any) => prismaToListWithMembership(list, Number(isMember)))
  } else {
    lists = listsPrisma.map(prismaToList)
  }

  return Response.json({ "lists": lists })
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

  // get number of lists created by this user
  const listCount = await prisma.list.count({
    where: {
      authorFid: Number(targetFid),
    },
  })

  const list = await prisma.list.create({
    data: {
      name: `New list ${listCount + 1}`,
      authorFid: Number(targetFid),
    }
  })

  trackPosthogEvent(supercastUser.fid, "list_created", {
    "listId": list.id,
    "asFid": targetFid,
  })

  return Response.json({ list })
}
