import { isAuthenticated } from '@/utils/auth/isAuthenticated';

export async function POST(req: Request) {

  const { authenticated } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  return Response.json({
    "error": "Legacy signer creation is disabled. Connect your Farcaster account with Sign in with Neynar from onboarding/settings."
  }, { status: 410 })
};
