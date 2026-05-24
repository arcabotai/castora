import { createHmac } from "crypto";
import { NextRequest } from "next/server";

export const isNeynarWebhook = async (req: NextRequest): Promise<{success: boolean, data: any}> => {
  try {
    const body = await req.text();
    
    const sig = req.headers.get("X-Neynar-Signature");
    if (!sig) {
      throw new Error("Neynar signature missing from request headers");
    }

    const webhookSecret = process.env.NEYNAR_NOTIFICATION_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("Make sure you set NEYNAR_WEBHOOK_SECRET in your .env file");
    }

    const hmac = createHmac("sha512", webhookSecret);
    hmac.update(body);

    const generatedSignature = hmac.digest("hex");

    const isValid = generatedSignature === sig;
    if (!isValid) {
      throw new Error("Invalid webhook signature");
    }
    
    const hookData = JSON.parse(body);
    
    return {success: true, data: hookData};
  } catch (error) {
    console.error("Neynar webhook validation error:", error);
    return {success: false, data: null};
  }
}