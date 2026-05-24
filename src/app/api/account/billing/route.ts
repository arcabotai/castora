import Stripe from 'stripe'

import { isAuthenticated } from '@/utils/auth/isAuthenticated';
import { prisma } from '@/prisma/client';
import { PAYMENT_TYPE, PLAN, PLAN_STATUS, PRODUCT_TYPE, SESSION_STATUS } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

type PastPayment = {
  product_name: string;
  usd_value: number;
  date: Date;
  payment_method: string;
  receipt_url: string;
}

type BillingData = {
  current_plan: string;
  paid_until: Date;
  past_payments: PastPayment[];
}

export async function GET(request: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(request)

  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const paymentSessions = await prisma.paymentSession.findMany({
    where: {
      supercastPrivyUserId: supercastUser.id,
      sessionStatus: SESSION_STATUS.SUCCESS,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const pastPayments: PastPayment[] = paymentSessions.map((paymentSession) => {
    let productName = ''
    if (paymentSession.productType === PRODUCT_TYPE.MEMBERSHIP) {
      productName = `Membership — ${paymentSession.productQuantity} month${paymentSession.productQuantity > 1 ? 's' : ''}`
    } else if (paymentSession.productType === PRODUCT_TYPE.REGISTRATION) {
      productName = 'Farcaster registration'
    } else if (paymentSession.productType === PRODUCT_TYPE.STORAGE) {
      productName = 'Farcaster storage'
    }
    return {
      product_name: productName,
      usd_value: paymentSession.usdValue,
      date: paymentSession.createdAt,
      payment_method: paymentSession.paymentMethod,
      receipt_url: paymentSession.receiptUrl || '',
    }
  })

  const billingData: BillingData = {
    current_plan: supercastUser.plan,
    paid_until: supercastUser.paidUntil,
    past_payments: pastPayments,
  }

  return Response.json(billingData)
}
