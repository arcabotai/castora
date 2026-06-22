import { isAuthenticated } from "@/utils/auth/isAuthenticated";
import { prisma } from "@/prisma/client";

// Attach an ADDITIONAL owned Farcaster account to the signed-in user, after they
// prove control of it via Sign in with Neynar. Unlike /api/account/siwn (which is
// the onboarding/first-account path and reassigns the user's primary fid), this is
// purely additive: it upserts the SupercastFarcasterAccount and creates a
// ConnectedAccount for the current user, and NEVER touches supercastPrivyUser.fid.

const parseFid = (fid: unknown): number | null => {
  const value = typeof fid === "string" ? Number.parseInt(fid, 10) : fid;
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
};

const parseSignerUUID = (signerUUID: unknown): string | null => {
  return typeof signerUUID === "string" && signerUUID.trim().length > 0
    ? signerUUID.trim()
    : null;
};

export async function POST(req: Request) {
  const { authenticated, supercastUser } = await isAuthenticated(req);

  if (!authenticated || !supercastUser) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Only an onboarded user can attach a sibling account. Guests must finish
  // onboarding (which establishes their primary account) first.
  if (supercastUser.fid === 0) {
    return Response.json(
      { error: "NOT_ONBOARDED", message: "Finish setting up your first account before adding more." },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => null);
  const fid = parseFid(body?.fid ?? body?.user?.fid);
  const signerUUID = parseSignerUUID(body?.signer_uuid ?? body?.signerUUID);

  if (!fid || !signerUUID) {
    return Response.json({ error: "Missing fid or signer_uuid from Neynar sign-in" }, { status: 400 });
  }

  // Don't let a user attach a Farcaster account that another Castora user already
  // controls — as their primary, as a connected (owned) account, or as one they've
  // shared with others. Attaching it here would overwrite that account's signer and
  // let one user co-opt another's account. Team access to someone else's account is
  // the "share access" feature instead, not owned-add. (So the signer upsert below
  // can only ever touch THIS user's own account.)
  const [ownedByOtherPrimary, existingAccount] = await Promise.all([
    prisma.supercastPrivyUser.findFirst({
      where: { fid, id: { not: supercastUser.id } },
      select: { id: true },
    }),
    prisma.supercastFarcasterAccount.findUnique({
      where: { fid },
      include: {
        ConnectedAccount: {
          where: { supercastPrivyUserId: { not: supercastUser.id } },
          select: { id: true },
          take: 1,
        },
        SharedAccount: {
          where: { sharedById: { not: supercastUser.id } },
          select: { id: true },
          take: 1,
        },
      },
    }),
  ]);

  const claimedByOther =
    !!ownedByOtherPrimary ||
    (existingAccount?.ConnectedAccount.length ?? 0) > 0 ||
    (existingAccount?.SharedAccount.length ?? 0) > 0;

  if (claimedByOther) {
    return Response.json(
      {
        error: "ACCOUNT_OWNED_BY_OTHER_USER",
        message: "This Farcaster account is already registered to another Castora user.",
      },
      { status: 409 },
    );
  }

  await prisma.$transaction(async (tx) => {
    const farcasterAccount = await tx.supercastFarcasterAccount.upsert({
      where: { fid },
      update: { signerUUID },
      create: { fid, signerUUID },
    });

    await tx.connectedAccount.upsert({
      where: {
        supercastFarcasterAccountId_supercastPrivyUserId: {
          supercastFarcasterAccountId: farcasterAccount.id,
          supercastPrivyUserId: supercastUser.id,
        },
      },
      update: {},
      create: {
        supercastFarcasterAccountId: farcasterAccount.id,
        supercastPrivyUserId: supercastUser.id,
      },
    });
  });

  return Response.json({ success: true, fid });
}
