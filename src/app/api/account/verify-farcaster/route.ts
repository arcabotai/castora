import { prisma } from "@/prisma/client";
import {
  getSignerFromNeynar,
  sendSignedToNeynar,
  signSigner,
} from "@/utils/signer";
import { PrivyClient } from "@privy-io/server-auth";
import { getBearerToken } from "@/utils/auth/getBearerToken";

export async function POST(req: Request) {
  const privy = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    process.env.PRIVY_SECRET_KEY
  );
  const authToken = getBearerToken(req);
  if (!authToken) {
    return Response.json({ error: "Invalid auth" }, { status: 401 });
  }

  try {
    const verifiedClaims = await privy.verifyAuthToken(authToken);

    // lookup privy data about this user
    const user = await privy.getUser(verifiedClaims.userId);

    const supercastPrivyUser = await prisma.supercastPrivyUser.findUnique({
      where: {
        privyUserId: verifiedClaims.userId,
      },
    });

    if (!supercastPrivyUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    let fid;
    let signerUUID;
    try {
      const body = await req.json();
      if (!body.fid || !body.signerUUID) {
        return Response.json(
          { error: "Invalid request body, missing fid or signerUUID" },
          { status: 400 }
        );
      }
      fid = body.fid;
      signerUUID = body.signerUUID;
    } catch (error) {
      console.error("Error parsing request body:", error);
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const existingSupercastPrivyUser =
      await prisma.supercastPrivyUser.findFirst({
        where: {
          fid: fid,
        },
      });

    // if there is no SupercastPrivyUser with that FID -> attach FID + SupercastFarcasterAccount -> it's a new users
    // we know because the currently authenticated supercastPrivyUser object has no FID per if statement condition!
    // as FID is unique for non 0 values -> findFirst is fine! If that assumption breaks, this code breaks!

    //verifiying a Farcaster account for a new user (no migration)
    if (!existingSupercastPrivyUser) {
      console.log(
        "/api/account/verify-farcaster - running new Farcaster Account addition"
      );

      // TODO: fix for SupercastUser
      const [supercastUser, connectedAccount] = await prisma.$transaction(
        async (tx) => {
          const supercastFarcasterAccount =
            await tx.supercastFarcasterAccount.upsert({
              where: {
                fid: fid,
              },
              create: {
                // if supercastFarcasterAccount doesn't exist -> create with the added signer
                fid: fid,
                signerUUID: signerUUID,
              },
              update: {
                // if supercastFarcasterAccount exists -> update signer
                signerUUID: signerUUID,
              },
            });

          // update SupercastPrivyUser with FID and SupercastFarcasterAccount
          const supercastUser = await tx.supercastPrivyUser.update({
            where: {
              privyUserId: user.id,
            },
            data: {
              fid: fid,
            },
          });

          // TODO: fix for SupercastUser
          const connectedAccount = await tx.connectedAccount.create({
            data: {
              supercastFarcasterAccountId: supercastFarcasterAccount.id,
              supercastPrivyUserId: supercastUser.id,
            },
          });

          return [supercastUser, connectedAccount];
        }
      );
      console.log(
        "/api/account/verify-farcaster - success: Verified Farcaster Account."
      );
    } else {
      // else Find and merge accounts

      console.log(
        "/api/account/verify-farcaster - merging existing Supercast user via Farcaster verification"
      );

      // DB TX to delete existing supercastPrivyUser with privyUserId and replace the Farcaster based privyUserId with the merged privyUserId
      await prisma.$transaction(async (tx) => {
        // ****
        // Migrate from Farcaster privy login
        // ****
        // First, delete the temporary account
        await tx.supercastPrivyUser.delete({
          where: { id: supercastPrivyUser.id },
        });

        // Then update the existing account with the new privyUserId
        await tx.supercastPrivyUser.update({
          where: { id: existingSupercastPrivyUser.id },
          data: {
            privyUserId: verifiedClaims.userId,
          },
        });
        // ****
        // End of Migration flow
        // ****

        const supercastFarcasterAccount =
          await tx.supercastFarcasterAccount.upsert({
            where: {
              fid: fid,
            },
            create: {
              // if supercastFarcasterAccount doesn't exist -> create with the added signer
              fid: fid,
              signerUUID: signerUUID,
            },
            update: {
              // if supercastFarcasterAccount exists -> update signer
              signerUUID: signerUUID,
            },
          });
      });
      console.log("/api/account/verify-farcaster - success: Merged Accounts.");
    }

    // return signer data to frontend
    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error("/api/account/verify-farcaster ERROR:", error);
    return Response.json(
      { error: "Failed Farcaster Verification" },
      { status: 500 }
    );
  }
}
