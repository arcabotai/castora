import { prisma } from "@/prisma/client"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from "axios"
import { neynar } from '@/lib/neynar'

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const listUUID = params.slug // 'a', 'b', or 'c'

  const { memberFid } = await request.json()

  const { authenticated, supercastUser } = await isAuthenticated(request)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(request.headers.get("asFid"))

  const { authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  const list = await prisma.list.findUnique({
    where: {
      id: listUUID,
      authorFid: Number(targetFid),
    },
  })

  if (!list) {
    return Response.json({ "error": "Not found" }, { status: 404 })
  }

  await prisma.listMembership.create({
    data: {
      listId: listUUID,
      memberFid: memberFid,
    },
  })

  // prisma query to find all members of list
  const listMembers = await prisma.listMembership.findMany({
    where: {
      listId: listUUID,
    },
  })

  const memberFids = listMembers.map((member: any) => (member.memberFid)).join(",")

  // fetch data for each member
  const response = await neynar.get(`/v2/farcaster/user/bulk/?fids=${memberFids}`)

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  return Response.json({ "members": response.data.users })
}
