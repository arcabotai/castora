import { prisma } from "@/prisma/client"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { trackPosthogEvent } from "@/utils/posthogAnalytics"

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const listUUID = params.slug // 'a', 'b', or 'c'

  const { authenticated, supercastUser } = await isAuthenticated(request)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(request.headers.get("asFid"))

  const { authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  await prisma.listFollowing.create({
    data: {
      listId: listUUID,
      followerFid: Number(targetFid),
    },
  })

  trackPosthogEvent(supercastUser.fid, "list_followed", {
    "listId": listUUID,
    "asFid": targetFid,
  })

  return Response.json({ "status": "success" })
}
