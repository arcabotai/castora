import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

type NeynarWebhookResult = {
  success: boolean;
  data: any;
  error?: "missing_signature" | "missing_secret" | "invalid_signature" | "invalid_payload";
}

const signaturesMatch = (expectedHex: string, receivedHex: string | null): boolean => {
  if (!receivedHex) return false;

  const normalizedReceived = receivedHex.trim().replace(/^sha512=/i, "");
  if (!/^[a-f0-9]+$/i.test(normalizedReceived)) return false;

  try {
    const expected = Buffer.from(expectedHex, "hex");
    const received = Buffer.from(normalizedReceived, "hex");

    if (expected.length !== received.length) return false;

    return timingSafeEqual(new Uint8Array(expected), new Uint8Array(received));
  } catch (_error) {
    return false;
  }
}

export const isNeynarWebhook = async (req: NextRequest): Promise<NeynarWebhookResult> => {
  const body = await req.text();
  const sig = req.headers.get("X-Neynar-Signature");

  if (!sig) {
    return { success: false, data: null, error: "missing_signature" };
  }

  const webhookSecret = process.env.NEYNAR_NOTIFICATION_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Neynar webhook secret missing");
    return { success: false, data: null, error: "missing_secret" };
  }

  const hmac = createHmac("sha512", webhookSecret);
  hmac.update(body);
  const generatedSignature = hmac.digest("hex");

  if (!signaturesMatch(generatedSignature, sig)) {
    return { success: false, data: null, error: "invalid_signature" };
  }

  try {
    return { success: true, data: JSON.parse(body) };
  } catch (_error) {
    return { success: false, data: null, error: "invalid_payload" };
  }
}
