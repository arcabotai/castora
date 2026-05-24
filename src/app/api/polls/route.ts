import { prisma } from '@/prisma/client'
import { isAuthenticated } from '@/utils/auth/isAuthenticated'
import { isAuthorized } from '@/utils/auth/isAuthorized'

import { EVENT_TYPE } from '@prisma/client'


export async function POST(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get('asFid'))

  const { authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  const data = await req.json()

  const farcasterAccount = await prisma.supercastFarcasterAccount.findFirst({
    where: {
      fid: Number(targetFid),
    },
  });

  const poll = await prisma.poll.create({
    data: {
      question: data.question,
      // todo validate username
      username: data.username,
      answer_1: data.answer1,
      answer_2: data.answer2,
      answer_3: data.answer3,
      answer_4: data.answer4,
      supercastFarcasterAccountId: farcasterAccount.id,
    },
  })

  return Response.json({ poll })
}