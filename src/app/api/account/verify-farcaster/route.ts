import { getBearerToken } from "@/utils/auth/getBearerToken";

export async function POST(req: Request) {
  const authToken = getBearerToken(req);
  if (!authToken) {
    return Response.json({ error: "Invalid auth" }, { status: 401 });
  }

  return Response.json({
    error: "Legacy Farcaster verification is disabled. Connect with Sign in with Neynar via /api/account/siwn."
  }, { status: 410 });
}
