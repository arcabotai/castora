import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { isAuthenticated } from '@/utils/auth/isAuthenticated'
import { HOST_URL } from '@/utils/hostURL'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16', // Use the latest API version
})

export async function POST(request: NextRequest) {
  try {
    const { authenticated, supercastUser } = await isAuthenticated(request)

    if (!authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const customerId = supercastUser.stripeCustomerId

    if (!customerId) {
      return NextResponse.json({ error: 'No Stripe customer ID found' }, { status: 400 })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${HOST_URL}/settings`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}