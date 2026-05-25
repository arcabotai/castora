import { prisma } from "@/prisma/client";
import { SupercastFarcasterAccount } from "@prisma/client";
import axios from "axios";
import { sendDirectCast } from "./direct-casts";
import { HOST_URL } from "./hostURL";

const warpcastAPIKey = process.env.WARPCAST_DM_API_KEY

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const GROUPCHAT_NAME_TO_ID = {
  "supercasters": "de8f16ad7e23cee11364d5984135abf46a99782eae5fe5b33184c0b6a4fa57e7",
  "alpha": "ecf5275b7e77a9d6603aea36362c38c4a38ccd4261e08ca868b4571807fd1cb6",
  "support": "127fd7badd507b2b6b0ea66694f4a50c00c6c92f8c9aaa2fd172ff6d0d68b6c1"
}

export const getAllMemberFids = async (): Promise<number[]> => {
  const privyMembers = await prisma.supercastPrivyUser.findMany({
    where: {
      plan: 'PERSONAL'
    },
    select: {
      fid: true,
    },
    distinct: ['fid'],
  });

  const supercastUserMembers = await prisma.supercastUser.findMany({
    where: {
      plan: 'PERSONAL'
    },
    select: {
      fid: true,
    },
    distinct: ['fid'],
  });

  const privyMemberFids = privyMembers.map(member => member.fid);
  const supercastUserMemberFids = supercastUserMembers.map(member => member.fid);

  // find unique fids
  const memberFids = new Set([...privyMemberFids, ...supercastUserMemberFids])

  return Array.from(memberFids);
}

export const addFidToGroupchat = async (fid: number, groupchatId: string) => {
  const response = await axios.put(`https://api.warpcast.com/fc/group-invites`, {
    "groupId": groupchatId,
    "invitees": [
      {
        "fid": fid,
        "role": "member"
      }
    ]
  }, {
    headers: {
      "Authorization": `Bearer ${warpcastAPIKey}`
    }
  })

  if (response.status !== 200) {
    throw new Error(`Failed to add fid ${fid} to groupchat ${groupchatId}`);
  } else {
    console.log(`Added fid ${fid} to groupchat ${groupchatId}`);
  }
}

export const removeFidFromGroupchat = async (fid: number, groupchatId: string) => {

  const response = await axios.delete(`https://api.warpcast.com/fc/group-members`, {
    headers: {
      "Authorization": `Bearer ${warpcastAPIKey}`
    },
    data: {
      "groupId": groupchatId,
      "memberFids": [fid]
    }
  })

  if (response.status !== 200) {
    throw new Error(`Failed to remove fid ${fid} from groupchat ${groupchatId}`);
  } else {
    console.log(`Removed fid ${fid} from groupchat ${groupchatId}`);
  }
}

export const getGroupchatMembers = async (groupchatId: string) => {

  let cursor = "";
  const members = [];

  while (true) {
    const response = await axios.get(`https://api.warpcast.com/fc/group-members`, {
      headers: {
        "Authorization": `Bearer ${warpcastAPIKey}`
      },
      params: { groupId: groupchatId, cursor }
    })

    members.push(...response.data.result.members.map(member => member.fid));
    cursor = response.data.next?.cursor;

    console.log(`Fetched ${members.length} members`);
    await delay(200);

    if (!cursor) {
      break;
    }
  }

  return members;
}

export const addToChannel = async (farcasterAccount: SupercastFarcasterAccount, channelId: string) => {

  const supercastSignerUUID = process.env.SUPERCAST_SIGNER_UUID

  const inviteResponse = await axios.post(`https://api.neynar.com/v2/farcaster/channel/member/invite/`, {
    "role": "member",
    "signer_uuid": supercastSignerUUID,
    "channel_id": channelId,
    "fid": farcasterAccount.fid
  }, {
    headers: {
      "x-api-key": process.env.NEYNAR_API_KEY
    }
  })

  const acceptResponse = await axios.put(`https://api.neynar.com/v2/farcaster/channel/member/invite/`, {
    "role": "member",
    "accept": true,
    "signer_uuid": farcasterAccount.signerUUID,
    "channel_id": channelId
  }, {
    headers: {
      "x-api-key": process.env.NEYNAR_API_KEY
    }
  })
}

export const removeFromChannel = async (fid: number, channelId: string) => {
  const supercastSignerUUID = process.env.SUPERCAST_SIGNER_UUID

  const response = await axios.delete(`https://api.neynar.com/v2/farcaster/channel/member/`, {
    headers: {
      "x-api-key": process.env.NEYNAR_API_KEY
    },
    data: {
      "channel_id": channelId,
      "fid": fid,
      "signer_uuid": supercastSignerUUID,
      "role": "member"
    }
  })
}

export const sendWelcomeMessage = async (fid: number) => {

  console.log("Sending welcome message to", fid);

  const message = `
Welcome to Castora! We are glad to have you.

The goal is to build the sharpest Farcaster experience: fast feeds, serious compose, useful notifications, friends map, and better social workflows.

All to make you feel like you are having a blast on farcaster.

If you are reading this message it means that you purchased the membership and are directly supporting our developemt.

I'm forever grateful for your support and trust.

Hope you will enjoy Castora and the community.

Please visit our community page (${HOST_URL}/community) to join the channel and access our groupchats.

This is an automated welcome message but if you reply to it i will definitely read it and do my best to reply back or help you (but it will be much faster if you use the support groupchat first).

Best,
Castora
`
  await sendDirectCast(fid, message, "castora")
}

export const sendGoodbyeMessage = async (fid: number) => {

  console.log("Sending goodbye message to", fid);

  const message = `
Your Castora membership has ran out.

We are sad to see you go.

You can come back anytime, just visit ${HOST_URL}.

If you have any feedback feel free to reply to this message.

Best,
Castora
`
  await sendDirectCast(fid, message, "castora")
}

export const memberOffboarding = async (fid: number) => {
  console.log("Offboarding member", fid);

  if (fid === 0) {
    return;
  }

  for (const groupchatId of Object.values(GROUPCHAT_NAME_TO_ID)) {
    console.log(`Removing fid ${fid} from groupchat ${groupchatId}`);
    await removeFidFromGroupchat(fid, groupchatId);
    console.log(`Removed from ${groupchatId} successfully`);
  }

  await removeFromChannel(fid, "super")
  await sendGoodbyeMessage(fid)
}

export const memberOnboarding = async (fid: number) => {

  console.log("Onboarding member", fid);

  if (fid === 0) {
    return;
  }

  await sendWelcomeMessage(fid)
}
