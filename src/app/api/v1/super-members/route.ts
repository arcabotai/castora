import { prisma } from "@/prisma/client"
import { PLAN } from "@prisma/client"
import { NextResponse } from "next/server"
import { publicCacheHeaders } from "@/utils/cacheHeaders"

export const dynamic = "force-dynamic";

type PublicSuperMember = {
  fid: number
  member_until: Date
}

type SuperMembersResponse = {
  members: PublicSuperMember[]
}

export async function GET(req: Request) {

  const superMembers = await prisma.supercastPrivyUser.findMany({
    where: {
      plan: PLAN.PERSONAL,
      fid: {
        not: 0,
      },
    },
    select: {
      fid: true,
      paidUntil: true,
    }
  })

  const publicSuperMembers: PublicSuperMember[] = superMembers.map((member) => ({
    fid: member.fid,
    member_until: member.paidUntil,
  }))

  const response: SuperMembersResponse = {
    members: publicSuperMembers,
  }

  return NextResponse.json(response, {
    headers: publicCacheHeaders({ browserMaxAge: 60, cdnMaxAge: 300, staleWhileRevalidate: 3600 }),
  })
}
