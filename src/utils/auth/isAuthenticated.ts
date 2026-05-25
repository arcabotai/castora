import { prisma } from '@/prisma/client'
import { SupercastPrivyUser } from '@prisma/client';
import { PrivyClient } from '@privy-io/server-auth';
import { trackPosthogEvent } from '../posthogAnalytics';
import { getBearerToken } from './getBearerToken';

type AuthenticationResponseData = {
  authenticated: boolean,
  supercastUser: SupercastPrivyUser | null
}

export const isAuthenticated = async (req: Request): Promise<AuthenticationResponseData> => {

  const privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID, process.env.PRIVY_SECRET_KEY);

  const authToken = getBearerToken(req);

  if (!authToken) {
    return {
      authenticated: false,
      supercastUser: null
    }
  }

  try {
    const verifiedClaims = await privy.verifyAuthToken(authToken);

    // lookup privy data about this user
    const user = await privy.getUser(verifiedClaims.userId);

    const supercastPrivyUser = await prisma.supercastPrivyUser.findUnique({
      where: {
        privyUserId: user.id
      }
    });

    if (!supercastPrivyUser) {
      return {
        authenticated: false,
        supercastUser: null
      }
    }

    return {
      authenticated: true,
      supercastUser: supercastPrivyUser
    }

  } catch (error) {

    trackPosthogEvent(parseInt(req.headers.get('asFid') || '0'), 'auth_error', {
      error_type: error.name,
      error_message: JSON.stringify(error.message)
    })

    console.log(`Token verification failed with error ${error}.`);

    return {
      authenticated: false,
      supercastUser: null
    }
  }
}