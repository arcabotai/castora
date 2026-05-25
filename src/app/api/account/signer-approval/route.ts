import { checkSignerApproval } from '@/utils/signer'
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { prisma } from '@/prisma/client'
import { SupercastPrivyUser } from '@prisma/client'

const migrateExistingUser = async (newlyCreatedSupercastPrivyUser: SupercastPrivyUser, existingSupercastPrivyUser: SupercastPrivyUser, signerUUID: string) => {

  await prisma.$transaction(async (tx) => {

    console.log('deleting temporary account')
    await tx.supercastPrivyUser.delete({
      where: { id: newlyCreatedSupercastPrivyUser.id },
    });

    console.log('swap privyUserId')
    await tx.supercastPrivyUser.update({
      where: { id: existingSupercastPrivyUser.id },
      data: {
        privyUserId: newlyCreatedSupercastPrivyUser.privyUserId,
      },
    });

    console.log('upserting farcaster account')
    const supercastFarcasterAccount = await tx.supercastFarcasterAccount.upsert({
      where: {
        fid: existingSupercastPrivyUser.fid,
      },
      update: {
        signerUUID: signerUUID,
      },
      create: {
        fid: existingSupercastPrivyUser.fid,
        signerUUID: signerUUID,
      },
    });

    console.log('upserting connectedAccount')
    const connectedAccount = await tx.connectedAccount.upsert({
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
}

const setupNewUser = async (newlyCreatedSupercastPrivyUser: SupercastPrivyUser, approvedSignerFid: number, approvedSignerUUID: string) => {
  await prisma.$transaction(async (tx) => {

    console.log('update fid on Castora user')
    const updatedSupercastPrivyUser = await tx.supercastPrivyUser.update({
      where: {
        id: newlyCreatedSupercastPrivyUser.id,
      },
      data: {
        fid: approvedSignerFid,
      },
    });

    console.log("upserting farcaster account")
    const supercastFarcasterAccount = await tx.supercastFarcasterAccount.upsert({
      where: {
        fid: approvedSignerFid,
      },
      update: {
        signerUUID: approvedSignerUUID,
      },
      create: {
        fid: approvedSignerFid,
        signerUUID: approvedSignerUUID,
      },
    });

    console.log('upserting connectedAccount')
    const connectedAccount = await tx.connectedAccount.upsert({
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
  }
  );
}

export async function POST(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const { signerUUID } = await req.json()

  const neynarData = await checkSignerApproval(signerUUID)

  if (neynarData.status !== "approved") {
    return Response.json({ "error": "Signer not approved" }, { status: 400 })
  }

  const approvedSignerFid = neynarData.fid
  const approvedSignerUUID = neynarData.signer_uuid

  if (supercastUser.fid !== 0) {
    // find the connected farcaster account and replace the signer

    const updatedFarcasterAccount = await prisma.supercastFarcasterAccount.upsert({
      where: {
        fid: approvedSignerFid,
      },
      update: {
        signerUUID: approvedSignerUUID,
      },
      create: {
        fid: approvedSignerFid,
        signerUUID: approvedSignerUUID,
      },
    })

    return Response.json({ "success": "New signer approved for existing user", "fid": approvedSignerFid }, { status: 200 })
  } else {
    // check if there is a Castora user with the same fid
    const existingSupercastPrivyUser = await prisma.supercastPrivyUser.findFirst({
      where: {
        fid: approvedSignerFid,
      },
    })

    // if there exists, run the migration
    if (existingSupercastPrivyUser) {
      console.log('existing Castora user', existingSupercastPrivyUser)
      await migrateExistingUser(supercastUser, existingSupercastPrivyUser, approvedSignerUUID)

      return Response.json({ "success": "Signer approved for existing user", "fid": approvedSignerFid }, { status: 200 })
    } else {
      console.log('setupNewUser')
      await setupNewUser(supercastUser, approvedSignerFid, approvedSignerUUID)

      return Response.json({ "success": "Signer approved for new user", "fid": approvedSignerFid }, { status: 200 })
    }
  }


  return Response.json(neynarData)
}
