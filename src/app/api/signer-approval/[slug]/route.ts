import { checkSignerApproval } from '@/utils/signer'

import { prisma } from '@/prisma/client'
import { EVENT_TYPE } from '@prisma/client'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const signerUUID = params.slug // 'a', 'b', or 'c'
  const neynarData = await checkSignerApproval(signerUUID)

  if (neynarData.status === "approved") {

    // add signer to the db
    await prisma.supercastFarcasterAccount.upsert({
      where: {
        fid: neynarData.fid,
      },
      create: {
        fid: neynarData.fid,
        signerUUID: signerUUID,
      },
      update: {
        signerUUID: signerUUID,
      },
    })
  }

  return Response.json({ "status": neynarData.status, "fid": neynarData.fid })
}
