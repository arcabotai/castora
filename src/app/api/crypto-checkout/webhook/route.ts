import {
  PAYMENT_TYPE,
  PLAN,
  PLAN_STATUS,
  SESSION_STATUS,
} from "@prisma/client";
import crypto from "node:crypto";
import { prisma } from "../../../../prisma/client";
import { trackPosthogEvent } from "../../../../utils/posthogAnalytics";
import { memberOnboarding } from "@/utils/members";
import { handleSuccessfulPayment } from "@/utils/checkout";

/** Handle Daimo Pay webhook */
export async function POST(request: Request) {
  // Auth — constant-time comparison so the static token can't be recovered via
  // response timing.
  const daimoPayWebhookToken = process.env.DAIMO_PAY_WEBHOOK_TOKEN;
  const expectedBytes = new TextEncoder().encode(daimoPayWebhookToken ? `Basic ${daimoPayWebhookToken}` : "");
  const providedBytes = new TextEncoder().encode(request.headers.get("Authorization") ?? "");
  const authOk =
    !!daimoPayWebhookToken &&
    providedBytes.length === expectedBytes.length &&
    crypto.timingSafeEqual(providedBytes, expectedBytes);
  if (!authOk) {
    console.error("DaimoPayWebhook: bad auth");
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
      return Response.json({ ignored: true });
    }

    // TODO: potentially check if the usd value matches
    const receiptUrl = `https://basescan.org/tx/${txHash}`;

    // Legit Daimo retries re-deliver this event, so make provisioning exactly-once.
    const existing = await prisma.paymentSession.findUnique({
      where: { sessionId: paymentId },
    });

    if (!existing) {
      console.warn(`DaimoPayWebhook: unknown session ${paymentId}; ignoring`);
      return Response.json({ success: true });
    }

    if (existing.sessionStatus === SESSION_STATUS.SUCCESS) {
      console.warn(`DaimoPayWebhook: session ${paymentId} already processed; skipping`);
      return Response.json({ success: true });
    }

    // Atomically claim the session (compare-and-swap on its current status) so two
    // concurrent deliveries can't both provision — only the one that flips it wins.
    const claim = await prisma.paymentSession.updateMany({
      where: { sessionId: paymentId, sessionStatus: existing.sessionStatus },
      data: { sessionStatus: SESSION_STATUS.SUCCESS, receiptUrl },
    });

    if (claim.count === 0) {
      console.warn(`DaimoPayWebhook: session ${paymentId} already claimed concurrently; skipping`);
      return Response.json({ success: true });
    }

    try {
      await handleSuccessfulPayment({ ...existing, sessionStatus: SESSION_STATUS.SUCCESS, receiptUrl });
    } catch (error) {
      // Provisioning failed after we claimed — revert so a Daimo retry can re-run it
      // (avoids "paid but not provisioned"). NOTE: handleSuccessfulPayment is not yet
      // idempotent, so a partial-then-failed provision could double-grant on retry —
      // making it idempotent (a processed-payment guard) is the proper follow-up.
      await prisma.paymentSession.update({
        where: { sessionId: paymentId },
        data: { sessionStatus: existing.sessionStatus, receiptUrl: existing.receiptUrl },
      });
      throw error;
    }

    return Response.json({ success: true });
  } else {
    console.error(`DaimoPayWebhook: unexpected type: ${type}`);
    return Response.json({});
  }
}
