import { NextRequest, NextResponse } from "next/server";
import Stripe from 'stripe';

import { prisma } from "@/prisma/client";
import { PAYMENT_METHOD, PRODUCT_TYPE, SESSION_STATUS } from "@prisma/client";;
import { isAuthenticated } from "@/utils/auth/isAuthenticated";
import { getAddress } from 'viem';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

const PRODUCT_TYPE_STRIPE_PRICE_ID = {
  [PRODUCT_TYPE.MEMBERSHIP]: process.env.STRIPE_MEMBERSHIP_PRICE_ID,
  [PRODUCT_TYPE.REGISTRATION]: process.env.STRIPE_REGISTRATION_PRICE_ID,
  [PRODUCT_TYPE.STORAGE]: process.env.STRIPE_STORAGE_PRICE_ID,
}

const PRODUCT_TYPE_USD_PRICE = {
  [PRODUCT_TYPE.MEMBERSHIP]: process.env.NEXT_PUBLIC_MEMBERSHIP_PRICE_USD,
  [PRODUCT_TYPE.REGISTRATION]: process.env.NEXT_PUBLIC_REGISTRATION_PRICE_USD,
  [PRODUCT_TYPE.STORAGE]: process.env.NEXT_PUBLIC_STORAGE_PRICE_USD,
}

export async function POST(request: NextRequest) {

  const { authenticated, supercastUser } = await isAuthenticated(request)

  if (!authenticated) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { productType, productQuantity, paymentMethod } = await request.json();

  const adjustedProductQuantity = productType === PRODUCT_TYPE.REGISTRATION ? 1 : productQuantity;

  try {

    const usdValue = Number(PRODUCT_TYPE_USD_PRICE[productType]) * Number(adjustedProductQuantity)
    if (paymentMethod === PAYMENT_METHOD.STRIPE) {

      const priceId = PRODUCT_TYPE_STRIPE_PRICE_ID[productType]

      if (!priceId) {
        return NextResponse.json({ error: "Invalid product type" }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        line_items: [{
          price: priceId,
          quantity: adjustedProductQuantity,
        }],
        mode: 'payment',
        redirect_on_completion: 'never',
      });

      const paymentSession = await prisma.paymentSession.create({
        data: {
          supercastPrivyUserId: supercastUser.id,
          productType,
          productQuantity: adjustedProductQuantity,
          usdValue,
          paymentMethod,
          sessionStatus: SESSION_STATUS.PENDING,
          sessionId: session.id,
        },
      });

      return NextResponse.json({ clientSecret: session.client_secret });

    } else if (paymentMethod === PAYMENT_METHOD.DAIMO) {

      const amountUsdc = Math.round(usdValue * 1e6).toString();
      console.log("amountUsdc", amountUsdc)
      const baseUsdcAddress = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
      const baseChainId = 8453;

      const response = await fetch("https://pay.daimo.com/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": '' + Math.random(),
          "Api-Key": process.env.DAIMO_PAY_API_KEY,
        },
        body: JSON.stringify({
          intent: "Subscribe",
          items: [],
          recipient: {
            address: getAddress(process.env.NEXT_PUBLIC_CRYPTO_PAYMENT_ADDRESS),
            amount: amountUsdc,
            token: baseUsdcAddress,
            chain: baseChainId,
            callData: "0x"
          },
        }),
      });
      if (!response.ok) {
        console.error(`Failed to generate Daimo Pay payment: ${response.status}`);
        console.error(await response.text());
        throw new Error('failed to generate Daimo Pay payment');
      }

      const { id: daimoPayId } = await response.json();
      console.log("daimoPayId", daimoPayId)
      const paymentSession = await prisma.paymentSession.create({
        data: {
          supercastPrivyUserId: supercastUser.id,
          productType,
          productQuantity: adjustedProductQuantity,
          usdValue,
          paymentMethod,
          sessionStatus: SESSION_STATUS.PENDING,
          sessionId: daimoPayId,
        },
      });

      console.log("paymentSession", paymentSession)
      return NextResponse.json({ daimoPayId });
    }

  } catch (error) {
    console.error("Error creating payment session:", error);
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }
} 