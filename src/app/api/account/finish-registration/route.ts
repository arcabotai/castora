import { prisma } from "@/prisma/client";
import { trackPosthogEvent } from "@/utils/posthogAnalytics";
import { PrivyClient } from "@privy-io/server-auth";
import axios from "axios";
import { neynar } from '@/lib/neynar'
import { getBearerToken } from "@/utils/auth/getBearerToken";

export async function POST(req: Request) {

  const privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID, process.env.PRIVY_SECRET_KEY);

  const authToken = getBearerToken(req);
  if (!authToken) {
    return Response.json({ "error": "Invalid auth" }, { status: 401 })
  }

  const {
    username,
    signature,
    deadline,
    fid,
    displayName,
    bio,
    avatar,
  } = await req.json();

  try {
    const verifiedClaims = await privy.verifyAuthToken(authToken);

    // lookup privy data about this user
    const user = await privy.getUser(verifiedClaims.userId);

    const supercastUser = await prisma.supercastPrivyUser.findUnique({
      where: {
        privyUserId: user.id
      }
    });

    if (!supercastUser) {
      return Response.json({ "error": "Castora user with this privyId not found" }, { status: 404 })
    }

    if (!supercastUser.registrationPaidFor) {
      return Response.json({ "error": "User has not paid for registration" }, { status: 400 })
    }

    const neynarRegistrationData = {
      signature: signature,
      fid: fid,
      requested_user_custody_address: user.wallet.address,
      deadline: deadline,
      fname: username,
    };

    let response;

    try {
      response = await neynar.post(`/v2/farcaster/user/`, neynarRegistrationData)
    } catch (error) {
      console.log(`Neynar fail with error: ${error}.`);
      return Response.json({ "error": "Neynar failed to register user" }, { status: 500 })
    }

    if (response.status !== 200) {
      return Response.json(response.data, { status: response.status })
    }

    const newNeynarSigner = response.data.signer.signer_uuid;

    // Atomic: a partial failure here would orphan rows and, because
    // SupercastFarcasterAccount.fid is unique, a retry would then throw on the
    // duplicate — wedging the registration. Roll back all-or-nothing.
    await prisma.$transaction(async (tx) => {
      await tx.supercastPrivyUser.update({
        where: { id: supercastUser.id },
        data: { fid: fid },
      })

      const supercastFarcasterAccount = await tx.supercastFarcasterAccount.create({
        data: { fid: fid, signerUUID: newNeynarSigner },
      })

      await tx.connectedAccount.create({
        data: {
          supercastFarcasterAccountId: supercastFarcasterAccount.id,
          supercastPrivyUserId: supercastUser.id,
        },
      })

      await tx.createdAccount.create({
        data: {
          createdById: supercastUser.id,
          createdSupercastAccountId: supercastUser.id,
        },
      })
    })

    trackPosthogEvent(fid, "account_created", {})

    const updateData = {
      display_name: displayName,
      bio: bio,
      pfp_url: avatar,
      signer_uuid: newNeynarSigner,
    }

    const updateDataResponse = await neynar.patch(`/v2/farcaster/user/`, updateData)

    // TODO return the updated user data and set the supercast user state on client side

    return Response.json({ "success": true });

  } catch (error) {
    console.log(`Account registration failed with error: ${error}.`);
  }

  return Response.json({ "error": "Invalid auth" }, { status: 401 })
}
