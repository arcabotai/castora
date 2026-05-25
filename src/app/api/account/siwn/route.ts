import { isAuthenticated } from "@/utils/auth/isAuthenticated";
import { prisma } from "@/prisma/client";
import { SupercastPrivyUser } from "@prisma/client";

const parseFid = (fid: unknown): number | null => {
  const value = typeof fid === "string" ? Number.parseInt(fid, 10) : fid;
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
};

const parseSignerUUID = (signerUUID: unknown): string | null => {
  return typeof signerUUID === "string" && signerUUID.trim().length > 0
    ? signerUUID.trim()
    : null;
};

const migrateExistingUser = async (
  newlyCreatedSupercastPrivyUser: SupercastPrivyUser,
  existingSupercastPrivyUser: SupercastPrivyUser,
  signerUUID: string,
) => {
  await prisma.$transaction(async (tx) => {
    await tx.connectedAccount.deleteMany({
      where: { supercastPrivyUserId: newlyCreatedSupercastPrivyUser.id },
    });

    await tx.supercastPrivyUser.delete({
      where: { id: newlyCreatedSupercastPrivyUser.id },
    });

    await tx.supercastPrivyUser.update({
      where: { id: existingSupercastPrivyUser.id },
      data: {
        privyUserId: newlyCreatedSupercastPrivyUser.privyUserId,
      },
    });

    const supercastFarcasterAccount = await tx.supercastFarcasterAccount.upsert({
      where: { fid: existingSupercastPrivyUser.fid },
      update: { signerUUID },
      create: {
        fid: existingSupercastPrivyUser.fid,
        signerUUID,
      },
    });

    await tx.connectedAccount.upsert({
      where: {
        supercastFarcasterAccountId_supercastPrivyUserId: {
          supercastFarcasterAccountId: supercastFarcasterAccount.id,
          supercastPrivyUserId: existingSupercastPrivyUser.id,
        },
      },
      update: {},
      create: {
        supercastPrivyUserId: existingSupercastPrivyUser.id,
        supercastFarcasterAccountId: supercastFarcasterAccount.id,
      },
    });
  });
};

const setupUserSigner = async (
  supercastUser: SupercastPrivyUser,
  fid: number,
  signerUUID: string,
) => {
  await prisma.$transaction(async (tx) => {
    const updatedSupercastPrivyUser = await tx.supercastPrivyUser.update({
      where: { id: supercastUser.id },
      data: { fid },
    });

    const supercastFarcasterAccount = await tx.supercastFarcasterAccount.upsert({
      where: { fid },
      update: { signerUUID },
      create: { fid, signerUUID },
    });

    await tx.connectedAccount.upsert({
      where: {
        supercastFarcasterAccountId_supercastPrivyUserId: {
          supercastFarcasterAccountId: supercastFarcasterAccount.id,
          supercastPrivyUserId: updatedSupercastPrivyUser.id,
        },
      },
      update: {},
      create: {
        supercastFarcasterAccountId: supercastFarcasterAccount.id,
        supercastPrivyUserId: updatedSupercastPrivyUser.id,
      },
    });
  });
};

export async function GET() {
  const clientId = process.env.NEYNAR_CLIENT_ID;

  if (!clientId) {
    return Response.json({ error: "NEYNAR_CLIENT_ID is not configured" }, { status: 500 });
  }

  return Response.json({ clientId });
}

export async function POST(req: Request) {
  const { authenticated, supercastUser } = await isAuthenticated(req);

  if (!authenticated || !supercastUser) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const fid = parseFid(body?.fid ?? body?.user?.fid);
  const signerUUID = parseSignerUUID(body?.signer_uuid ?? body?.signerUUID);

  if (!fid || !signerUUID) {
    return Response.json({ error: "Missing fid or signer_uuid from Neynar sign-in" }, { status: 400 });
  }

  if (supercastUser.fid !== 0) {
    await setupUserSigner(supercastUser, fid, signerUUID);
    return Response.json({ success: true, fid, message: "Signer approved for existing user" });
  }

  const existingSupercastPrivyUser = await prisma.supercastPrivyUser.findFirst({
    where: { fid },
  });

  if (existingSupercastPrivyUser) {
    await migrateExistingUser(supercastUser, existingSupercastPrivyUser, signerUUID);
    return Response.json({ success: true, fid, message: "Signer approved for existing Castora user" });
  }

  await setupUserSigner(supercastUser, fid, signerUUID);
  return Response.json({ success: true, fid, message: "Signer approved for new Castora user" });
}
