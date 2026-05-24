import { prisma } from "@/prisma/client"
import { PLAN, PLAN_STATUS } from "@prisma/client";
import { PrivyClient } from "@privy-io/server-auth"

export async function POST(req: Request) {

  const privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID, process.env.PRIVY_SECRET_KEY);

  const authToken = req.headers.get("Authorization").split("Bearer ")[1];

  try {
    const verifiedClaims = await privy.verifyAuthToken(authToken);

    const user = await privy.getUser(verifiedClaims.userId);

    const supercastUser = await prisma.supercastPrivyUser.upsert({
      where: {
        privyUserId: user.id,
      },
      update: {
        email: user.email.address,
      },
      create: {
        privyUserId: user.id,
        fid: 0,
        email: user.email.address,
      },
    })

    return Response.json({
      fid: supercastUser.fid,
    })

  } catch (error) {
    console.log(`Token verification failed with error ${error}.`);
  }

  return Response.json({ "error": "Invalid auth" }, { status: 401 })
}