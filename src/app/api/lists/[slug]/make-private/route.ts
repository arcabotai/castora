import { prisma } from "@/prisma/client"
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import { Prisma } from "@prisma/client"
// these imports look bad but unfortunately make sense

export async function PUT(
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

  try {
    await prisma.list.update({
      where: {
        id: listUUID,
        authorFid: Number(targetFid),
      },
      data: {
        private: true,
      },
    })
  } catch (error) {

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
      if (error.code === 'P2025') {
        return Response.json({ "error": "Not found" }, { status: 404 })
      }
    }
    throw error
  }

  return Response.json({ "success": true })
}
