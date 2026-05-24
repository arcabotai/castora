import {
  PAYMENT_TYPE,
  PLAN,
  PLAN_STATUS,
  SESSION_STATUS,
} from "@prisma/client";
import { prisma } from "../../../../prisma/client";
import { trackPosthogEvent } from "../../../../utils/posthogAnalytics";
import { memberOnboarding } from "@/utils/members";
import { handleSuccessfulPayment } from "@/utils/checkout";
import { getChainExplorerTxUrl } from "@daimo/contract";

/** Handle Daimo Pay webhook */
export async function POST(request: Request) {
  // Auth
  const daimoPayWebhookToken = process.env.DAIMO_PAY_WEBHOOK_TOKEN;
  const auth = request.headers.get("Authorization");
  if (auth !== `Basic ${daimoPayWebhookToken}`) {
    console.error(`DaimoPayWebhook: bad auth: ${auth}`);
    return Response.json({}, { status: 401 });
  }

  // Parse
  const { type, paymentId, chainId, txHash } = await request.json();
  console.log(`DaimoPayWebhook: ${type} ${paymentId} ${txHash}`);

  if (type === "payment_started") {
    // Ignore, we are handling this via /crypto-checkout/create-session
    return Response.json({});
  } else if (type === "payment_completed") {
    if (chainId !== 8453) {
      console.warn(`DaimoPayWebhook: unexpected chainId: ${chainId}`);
      return;
    }

    // TODO: potentially check if the usd value matches
    const receiptUrl = getChainExplorerTxUrl(chainId, txHash);

    const updatedPaymentSession = await prisma.paymentSession.update({
      where: {
        sessionId: paymentId,
      },
      data: {
        sessionStatus: SESSION_STATUS.SUCCESS,
        receiptUrl
      },
    })

    await handleSuccessfulPayment(updatedPaymentSession)

    return Response.json({ success: true });
  } else {
    console.error(`DaimoPayWebhook: unexpected type: ${type}`);
    return Response.json({});
  }
}
