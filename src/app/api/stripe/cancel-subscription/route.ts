import Stripe from 'stripe'

import { isAuthenticated } from '@/utils/auth/isAuthenticated';
import { trackPosthogEvent } from '@/utils/posthogAnalytics';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(request: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(request)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const subscriptionId = supercastUser.stripeSubscriptionId;

  if (!subscriptionId) {
    return Response.json({ 'error': 'NO_STRIPE_DATA' }, { status: 400 });
  }

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true
  });

  return Response.json({
    'subscription_status': subscription.status
  });
}
