import { prisma } from "@/prisma/client";
import { PrivyClient } from "@privy-io/server-auth";

export async function GET(req: Request) {

  const privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID, process.env.PRIVY_SECRET_KEY);

  const authToken = req.headers.get("Authorization").split("Bearer ")[1];

  const url = new URL(req.url);
  const username = url.searchParams.get("username");

  try {
    const verifiedClaims = await privy.verifyAuthToken(authToken);

    // lookup privy data about this user
    const user = await privy.getUser(verifiedClaims.userId);

    // check if the user has fid
    // check if there is an approved signer

    const supercastPrivyUser = await prisma.supercastPrivyUser.findUnique({
      where: {
        privyUserId: verifiedClaims.userId
      }
    })

    if (!supercastPrivyUser) {
      return Response.json({ "error": "User not found" }, { status: 404 });
    }

    if (!supercastPrivyUser.fid) {
      return Response.json({
        "stage": 1,
        "fid": undefined
      });
    }

    const supercastFarcasterAccount = await prisma.supercastFarcasterAccount.findUnique({
      where: {
        fid: supercastPrivyUser.fid
      }
    })

    if (!supercastFarcasterAccount) {
      return Response.json({
        "stage": 1,
        "fid": supercastPrivyUser.fid
      });
    }

    if (!supercastFarcasterAccount.signerUUID) {
      return Response.json({
        "stage": 2,
        "fid": supercastPrivyUser.fid
      });
    }

    if (!!supercastFarcasterAccount.signerUUID) {
      return Response.json({
        "stage": 3,
        "fid": supercastPrivyUser.fid
      });
    }

    return Response.json({ "error": "Unexpected state" }, { status: 404 });

  } catch (error) {
    console.log(`Token verification failed with error ${error}.`);
  }

  return Response.json({ "error": "Invalid auth" }, { status: 401 })
}