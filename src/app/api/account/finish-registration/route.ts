import { prisma } from "@/prisma/client";
import { trackPosthogEvent } from "@/utils/posthogAnalytics";
import { PrivyClient } from "@privy-io/server-auth";
import axios from "axios";

export async function POST(req: Request) {

  const privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID, process.env.PRIVY_SECRET_KEY);

  const authToken = req.headers.get("Authorization").split("Bearer ")[1];

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
      return Response.json({ "error": "SupercastPrivyUser with this privyId not found" }, { status: 404 })
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

    console.log(neynarRegistrationData);

    let response;

    try {
      response = await axios.post(`https://api.neynar.com/v2/farcaster/user`, neynarRegistrationData, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })
    } catch (error) {
      console.log(`Neynar fail with error: ${error}.`);
      return Response.json({ "error": "Neynar failed to register user" }, { status: 500 })
    }

    if (response.status !== 200) {
      console.log(response);
      return Response.json(response.data, { status: response.status })
    }

    const newNeynarSigner = response.data.signer.signer_uuid;

    await prisma.supercastPrivyUser.update({
      where: {
        id: supercastUser.id
      },
      data: {
        fid: fid
      }
    })

    const supercastFarcasterAccount = await prisma.supercastFarcasterAccount.create({
      data: {
        fid: fid,
        signerUUID: newNeynarSigner
      }
    })

    const connectedAccount = await prisma.connectedAccount.create({
      data: {
        supercastFarcasterAccountId: supercastFarcasterAccount.id,
        supercastPrivyUserId: supercastUser.id,
      }
    })

    const createdAccount = await prisma.createdAccount.create({
      data: {
        createdById: supercastUser.id,
        createdSupercastAccountId: supercastUser.id,
      }
    })

    trackPosthogEvent(fid, "account_created", {})

    const updateData = {
      display_name: displayName,
      bio: bio,
      pfp_url: avatar,
      signer_uuid: newNeynarSigner,
    }

    const updateDataResponse = await axios.patch(`https://api.neynar.com/v2/farcaster/user`, updateData, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })

    // TODO return the updated user data and set the supercast user state on client side

    return Response.json({ "success": true });

  } catch (error) {
    console.log(`Account registration failed with error: ${error}.`);
  }

  return Response.json({ "error": "Invalid auth" }, { status: 401 })
}