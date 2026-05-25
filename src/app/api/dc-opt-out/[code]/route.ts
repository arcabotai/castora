import { prisma } from "@/prisma/client";
import { OPT_OUT_TYPE } from "@prisma/client";
import axios from "axios";

const readOptOutCode = async (code: string) => {
  const segments = code.split("-");

  const transformedFid = segments[5];
  const boostRequestId = segments.slice(0, 5).join("-");

  const boostRequest = await prisma.boostRequest.findFirst({
    where: {
      id: boostRequestId,
    },
  });

  if (!boostRequest) {
    return {
      "userFid": 0,
      "targetFid": 0
    }
  }

  // is math in js safe??
  const userFid = Math.floor((Number(transformedFid) / 2 + 7) / 3 - 2);

  if (!boostRequest.recipientFids.includes(userFid) && !(boostRequest.authorFid == userFid)) {
    return {
      "userFid": 0,
      "targetFid": 0
    }
  }

  return {
    "userFid": userFid,
    "targetFid": boostRequest.authorFid
  }
}

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  const optOutCode = params.code;

  const { userFid, targetFid } = await readOptOutCode(optOutCode);

  if (userFid === 0) {
    return Response.json({ error: "Invalid opt out code" }, { status: 400 });
  }

  const { personalOptOut, globalOptOut } = await request.json();

  // true means that someone wants to opt out

  try {
    if (personalOptOut === true) {
      const optout = await prisma.boostRequestOptOut.create({
        data: {
          userFid: Number(userFid),
          targetFid: Number(targetFid),
          type: OPT_OUT_TYPE.PERSONAL,
          boostId: "",
        },
      });

      console.log(optout);
    }

    if (personalOptOut === false) {
      await prisma.boostRequestOptOut.deleteMany({
        where: {
          userFid: Number(userFid),
          targetFid: Number(targetFid),
          type: OPT_OUT_TYPE.PERSONAL,
        },
      });
    }

    if (globalOptOut === true) {
      await prisma.boostRequestOptOut.create({
        data: {
          userFid: Number(userFid),
          targetFid: 0,
          type: OPT_OUT_TYPE.GLOBAL,
          boostId: "",
        },
      });
    }

    if (globalOptOut === false) {
      await prisma.boostRequestOptOut.deleteMany({
        where: {
          userFid: Number(userFid),
          targetFid: 0,
          type: OPT_OUT_TYPE.GLOBAL,
        },
      });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  const optOutCode = params.code;

  const { userFid, targetFid } = await readOptOutCode(optOutCode);

  if (userFid === 0) {
    return Response.json({ error: "Invalid opt out code" }, { status: 400 });
  }

  // get user data about target fid
  const targetUserDataResponse = await axios.get(`https://api.neynar.com/v2/farcaster/user/bulk/?fids=${targetFid}`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

  const targetUsername = targetUserDataResponse.status === 200 ? targetUserDataResponse.data.users[0].username : targetFid

  if (targetUserDataResponse.status !== 200) {
    return Response.json({ "error": "Could not fetch user data" }, { status: 500 })
  }

  const userOptOuts = await prisma.boostRequestOptOut.findMany({
    where: {
      userFid: Number(userFid),
    },
  });

  // check if there is an opt out with the targetFid
  const personalOptOut = userOptOuts.some((optOut) => optOut.targetFid === Number(targetFid))

  // check if there is a global opt out
  const globalOptOut = userOptOuts.some((optOut) => optOut.type === OPT_OUT_TYPE.GLOBAL)

  return Response.json({
    "personalOptOut": personalOptOut,
    "globalOptOut": globalOptOut,
    "targetUsername": targetUsername,
  });
}