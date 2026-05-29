import { prisma } from "@/prisma/client"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from "axios"
import { neynar } from '@/lib/neynar'

const prismaToList = (list: any, isFollowing: boolean) => {
  return {
    id: list.id,
    name: list.name,
    authorFid: list.authorFid,
    followingCount: list._count.ListFollowing,
    membershipCount: list._count.ListMembership,
    private: list.private,
    followingStatus: isFollowing,
  }
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const listUUID = params.slug

  const { authenticated, supercastUser } = await isAuthenticated(request)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(request.headers.get("asFid"))

  const { authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  const listPrisma = await prisma.list.findUnique({
    where: {
      id: listUUID,
    },
    select: {
      id: true,
      name: true,
      authorFid: true,
      private: true,
      ListMembership: {
        select: {
          memberFid: true,
        },
      },
      ListFollowing: {
        select: {
          followerFid: true,
        },
      },
      _count: {
        select: {
          ListMembership: true,
          ListFollowing: true,
        },
      },
    },
  })

  if (!listPrisma) {
    return Response.json({ 'error': 'List not found' }, { status: 404 })
  }

  const isFollowing = listPrisma.ListFollowing.some(follower => follower.followerFid === targetFid)

  const list = prismaToList(listPrisma, isFollowing)

  const memberFids = listPrisma.ListMembership.map((member: any) => (member.memberFid))
  const authorFid = listPrisma.authorFid

  const queryFids = [...memberFids, authorFid].join(",")

  // fetch data for each member and author
  const response = await neynar.get(`/v2/farcaster/user/bulk/?fids=${queryFids}`)

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  const members = response.data.users.filter((user: any) => memberFids.includes(user.fid))
  const author = response.data.users.find((user: any) => user.fid === authorFid)

  return Response.json({ list, members, author })
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const listUUID = params.slug

  const { name } = await request.json()

  const { authenticated, supercastUser } = await isAuthenticated(request)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(request.headers.get("asFid"))

  const { authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  const list = await prisma.list.update({
    where: {
      id: listUUID,
      authorFid: Number(targetFid),
    },
    data: {
      name: name,
    },
  })

  return Response.json({ list })
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const listUUID = params.slug

  const { authenticated, supercastUser } = await isAuthenticated(request)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(request.headers.get("asFid"))

  const { authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  const list = await prisma.list.delete({
    where: {
      id: listUUID,
      authorFid: Number(targetFid),
    },
  })
  return Response.json({ list })
}