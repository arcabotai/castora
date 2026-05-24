import Stripe from 'stripe'

import { HOST_URL } from '@/utils/hostURL';
import { prisma } from '@/prisma/client';
import { EVENT_TYPE } from '@prisma/client';

import { PLAN, SESSION_STATUS } from '@prisma/client';
import { isAuthenticated } from '@/utils/auth/isAuthenticated';
import { isAuthorized } from '@/utils/auth/isAuthorized';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(request: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(request)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const { period } = await request.json()

  const price = period === 'yearly' ? process.env.STRIPE_PERSONAL_YEARLY_PLAN_PRICE_ID : process.env.STRIPE_PERSONAL_PLAN_PRICE_ID

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: price,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    allow_promotion_codes: true,
    success_url: `${HOST_URL}`,
    cancel_url: `${HOST_URL}`,
  });

  const sessionPrismaObject = await prisma.stripeSession.create({
    data: {
      sessionId: session.id,
      fid: supercastUser.fid,
      plan: PLAN.PERSONAL,
      status: SESSION_STATUS.PENDING,
      supercastPrivyUserId: supercastUser.id,
    },
  });

  return Response.json({ url: session.url });
}
