import { prisma } from "@/prisma/client"
import { PLAN, PLAN_STATUS } from "@prisma/client";
import { PrivyClient } from "@privy-io/server-auth"

export async function POST(req: Request) {

  const privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID, process.env.PRIVY_SECRET_KEY);

  const authorization = req.headers.get("Authorization") || "";
  const authToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!authToken || authToken === "null" || authToken === "undefined") {
    return Response.json({ "error": "Invalid auth" }, { status: 401 })
  }

  try {
    const verifiedClaims = await privy.verifyAuthToken(authToken);

    const user = await privy.getUser(verifiedClaims.userId);
    const email = user.email?.address || "";

    const supercastUser = await prisma.supercastPrivyUser.upsert({
      where: {
        privyUserId: user.id,
      },
      update: {
        email,
      },
      create: {
        privyUserId: user.id,
        fid: 0,
        email,
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