import { prisma } from "@/prisma/client";
import { isAuthenticated } from "@/utils/auth/isAuthenticated";

export async function GET(req: Request) {
  const { authenticated, supercastUser } = await isAuthenticated(req);

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const user = await prisma.supercastPrivyUser.findUnique({
    where: { id: supercastUser.id }
  });

  return Response.json({ registrationPaidFor: user?.registrationPaidFor });
} 