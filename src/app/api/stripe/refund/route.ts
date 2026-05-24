import Stripe from 'stripe'

import { isAuthenticated } from '@/utils/auth/isAuthenticated';
import { trackPosthogEvent } from '@/utils/posthogAnalytics';
import { prisma } from '@/prisma/client';
import { PLAN, PLAN_STATUS } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(request: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(request)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const customerId = supercastUser.stripeCustomerId;

  const charges = await stripe.charges.list({ customer: customerId });

  // if there are no charges, return an error
  if (!charges.data.length) {
    return Response.json({ 'error': 'NO_CHARGES' }, { status: 400 });
  }

  // if there is only one charge, return an error
  if (charges.data.length === 1) {
    return Response.json({ 'error': 'ONLY_ONE_CHARGE' }, { status: 400 });
  }

  // if the last charge is older than 48 hours or unsuccessful, return an error
  const lastCharge = charges.data[0];

  const lastChargeDate = new Date(lastCharge.created * 1000);

  const currentDate = new Date();

  const timeDifference = currentDate.getTime() - lastChargeDate.getTime();
  const hoursDifference = timeDifference / (1000 * 3600);

  // if the last charge is older than 48 hours or unsuccessful or refunded, return an error
  if (hoursDifference > 48 || lastCharge.status !== 'succeeded' || lastCharge.refunded) {
    return Response.json({ 'error': 'LAST_CHARGE_NOT_ELIGIBLE' }, { status: 400 });
  }

  const refund = await stripe.refunds.create({ charge: lastCharge.id });

  trackPosthogEvent(
    supercastUser.fid,
    "refund_requested",
    {}
  )

  // if subscription is not cancelled yet, cancel it
  const subscriptionId = supercastUser.stripeSubscriptionId;

  if (!subscriptionId) {
    return Response.json({ 'error': 'NO_STRIPE_DATA' }, { status: 400 });
  }

  const subscription = await stripe.subscriptions.cancel(subscriptionId);

  const updateUser = await prisma.supercastPrivyUser.update({
    where: {
      id: supercastUser.id
    },
    data: {
      plan: PLAN.FREE,
      planState: PLAN_STATUS.CANCELLED
    }
  });

  return Response.json({
    'refund_status': refund.status,
    'subscription_status': subscription.status
  });
}
