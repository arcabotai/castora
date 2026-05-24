import { prisma } from "@/prisma/client";
import { SupercastUserState } from "@/types";
import { isAuthenticated } from "@/utils/auth/isAuthenticated";
import { isAuthorized } from "@/utils/auth/isAuthorized";
import { PLAN } from "@prisma/client";
import axios from "axios";

export async function GET(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated || supercastUser?.fid === 0) {
    return Response.json(
      {
        "state":
        {
          "userFid": 0,
          "accounts": [],
          "plan": "",
        }
      })
  }

  const farcasterAccounts = await prisma.supercastPrivyUser.findUnique({
    where: {
      id: supercastUser.id,
    },
    include: {
      ConnectedAccount: {
        select: {
          SupercastFarcasterAccount: true,
        },
      },
      ReceivedSharedAccounts: {
        select: {
          SupercastFarcasterAccount: true,
        },
      },
    },
  });

  const connectedFids = farcasterAccounts.ConnectedAccount.map((account) => account.SupercastFarcasterAccount.fid);
  const sharedWithFids = farcasterAccounts.ReceivedSharedAccounts.map((account) => account.SupercastFarcasterAccount.fid);

  const ANON_MODE_ENABLED = process.env.NEXT_PUBLIC_ANON_MODE_ENABLED === 'true';

  if (ANON_MODE_ENABLED && supercastUser.plan === PLAN.PERSONAL) {
    connectedFids.push(Number(process.env.NEXT_PUBLIC_SUPERANON_FID))
  }

  const allFids = connectedFids.concat(sharedWithFids).join(",");

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${allFids}`, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  const supercastUserState = {
    accounts: response.data.users.map((user) => {
      return {
        fid: user.fid,
        displayName: user.display_name,
        avatar: user.pfp_url,
        username: user.username,
        powerBadge: user.power_badge,
        connectedAddress: user.verified_addresses.eth_addresses.length > 0 ? user.verified_addresses.eth_addresses[0] : "",
        connected: connectedFids.includes(user.fid),
        sharedWith: sharedWithFids.includes(user.fid),
      }
    }),
    userFid: supercastUser.fid,
    plan: supercastUser.plan,
  }

  return Response.json({ "state": supercastUserState })
}