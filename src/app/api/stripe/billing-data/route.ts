import Stripe from 'stripe'

import { isAuthenticated } from '@/utils/auth/isAuthenticated';
import { prisma } from '@/prisma/client';
import { PAYMENT_TYPE, PLAN, PLAN_STATUS } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function GET(request: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(request)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  if (supercastUser.paymentType === PAYMENT_TYPE.CRYPTO) {
    return Response.json({
      'current_period_end': new Date(supercastUser.paidUntil).getTime(),
      'cancel_at_period_end': false,
      'refund_eligible': false,
      'subscription_status': 'active',
      'previously_stripe_subscription': Boolean(supercastUser.stripeSubscriptionId),
      'payment_type': PAYMENT_TYPE.CRYPTO,
    });
  }

  const customerId = supercastUser.stripeCustomerId;
  const subscriptionId = supercastUser.stripeSubscriptionId;

  if (!customerId || !subscriptionId) {
    return Response.json({
      'current_period_end': 3124310400 * 1000,
      'cancel_at_period_end': true,
      'refund_eligible': false,
    });
  }

  const charges = await stripe.charges.list({
    customer: customerId,
  });

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  let refundEligible = false;

  if (charges.data.length > 1) {
    // if last time charge was successful and not refunded and is less than 48 hours old and there is more than 1 charge, mark it as eligible for refund
    const lastCharge = charges.data[0];
    const lastChargeDate = new Date(lastCharge.created * 1000);
    const currentDate = new Date();
    const timeDifference = currentDate.getTime() - lastChargeDate.getTime();
    const hoursDifference = timeDifference / (1000 * 3600);

    refundEligible = lastCharge.status === 'succeeded' && hoursDifference < 48 && lastCharge.refunded === false;
  }

  if (subscription.status === 'canceled') {
    const updatedUser = await prisma.supercastPrivyUser.update({
      where: {
        id: supercastUser.id,
      },
      data: {
        plan: PLAN.FREE,
        planState: PLAN_STATUS.CANCELLED,
      },
    });
  }

  return Response.json({
    'current_period_end': subscription.current_period_end * 1000,
    'cancel_at_period_end': subscription.cancel_at_period_end,
    'refund_eligible': refundEligible,
    'subscription_status': subscription.status,
    'payment_type': PAYMENT_TYPE.STRIPE,
  });
}
