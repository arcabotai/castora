import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { prisma } from '@/prisma/client'
import { PAYMENT_TYPE, PLAN, PLAN_STATUS, PRODUCT_TYPE, SESSION_STATUS } from '@prisma/client'
import { handleSuccessfulPayment } from '@/utils/checkout'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(req: Request) {
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      await (await req.blob()).text(),
      req.headers.get('stripe-signature') as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    // On error, log and return the error message.
    if (err! instanceof Error) console.log(err)
    console.log(`❌ Error message: ${errorMessage}`)
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    )
  }

  const permittedEvents: string[] = [
    'checkout.session.completed',
    'payment_intent.succeeded',
    'customer.subscription.updated'
  ]

  if (permittedEvents.includes(event.type)) {
    let data

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          data = event.data.object as Stripe.Checkout.Session
          console.log(data)
          console.log(`💰 CheckoutSession status: ${data.payment_status}`)

          const paymentIntent = await stripe.paymentIntents.retrieve(data.payment_intent as string)
          const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string)
          const receiptUrl = charge.receipt_url;

          const updatedPaymentSession = await prisma.paymentSession.update({
            where: {
              sessionId: data.id,
            },
            data: {
              sessionStatus: SESSION_STATUS.SUCCESS,
              receiptUrl: receiptUrl,
            },
          })

          await handleSuccessfulPayment(updatedPaymentSession)

          break

        case 'payment_intent.succeeded':
          data = event.data.object as Stripe.PaymentIntent
          console.log(data)
          console.log(`💰 PaymentIntent status: ${data.status}`)
          break

        default:
          throw new Error(`Unhandled event: ${event.type}`)
      }
    } catch (error) {
      console.log(error)
      return NextResponse.json(
        { message: 'Webhook handler failed' },
        { status: 500 }
      )
    }
  }
  return NextResponse.json({ message: 'Received' }, { status: 200 })
}