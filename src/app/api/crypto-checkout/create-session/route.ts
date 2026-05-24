import { prisma } from '@/prisma/client';

import { PLAN, SESSION_STATUS } from '@prisma/client';
import { isAuthenticated } from '@/utils/auth/isAuthenticated';
import { getAddress } from 'viem';

export async function POST(request: Request) {
  const { authenticated, supercastUser } = await isAuthenticated(request)
  if (!authenticated) {
    return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  // Create a Daimo Pay checkout
  const { amountUsd } = await request.json()
  const payId = await createDaimoPayment({ amountUsd });

  // Create a CryptoCheckoutSession in our DB
  const sessionPrismaObject = await prisma.cryptoCheckoutSession.upsert({
    where: {
      daimoPayId: payId
    },
    update: {},
    create: {
      daimoPayId: payId,
      daimoPayAmountUsd: amountUsd,
      plan: PLAN.PERSONAL,
      status: SESSION_STATUS.PENDING,
      supercastPrivyUserId: supercastUser.id,
    },
  });

  return Response.json({
    id: sessionPrismaObject.id,
    payId
  });
}

/** Returns a Daimo Pay payId */
async function createDaimoPayment({amountUsd}: {amountUsd: number}): Promise<string> {
  const amountUsdc = Math.round(amountUsd * 1e6).toString();
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

  const {id} = await response.json();
  return id;
}