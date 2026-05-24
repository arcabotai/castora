
import { prisma } from '@/prisma/client'
import Stripe from 'stripe';

import { PAYMENT_TYPE, PLAN, SESSION_STATUS } from '@prisma/client';
import { isAuthenticated } from '@/utils/auth/isAuthenticated';
import { trackPosthogEvent } from '@/utils/posthogAnalytics';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(request: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(request)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const subscription = await stripe.subscriptions.retrieve(supercastUser.stripeSubscriptionId);

  const currentPeriodEnd = subscription.current_period_end * 1000

  const updatedSubscription = await stripe.subscriptions.update(supercastUser.stripeSubscriptionId, {
    cancel_at_period_end: true
  });

  const updatedUser = await prisma.supercastPrivyUser.update({
    where: {
      id: supercastUser.id,
    },
    data: {
      paymentType: PAYMENT_TYPE.CRYPTO,
      paidUntil: new Date(currentPeriodEnd),
    },
  })

  trackPosthogEvent(supercastUser.fid, "subscription_started", {
    "payment_method": "crypto",
    "type": "switch_to_onchain",
  })

  return Response.json({
    success: true,
  });
}
