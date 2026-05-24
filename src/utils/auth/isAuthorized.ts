import { prisma } from '@/prisma/client'
import { PLAN, SupercastFarcasterAccount, SupercastPrivyUser } from '@prisma/client'

type AuthorizationResponseData = {
  authorized: boolean,
  farcasterAccount: SupercastFarcasterAccount | null,
  error_message: "" | "NO_ACCESS" | "NO_SIGNER_APPROVED" | "NO_FARCASTER_ACCOUNT" | "NO_TARGET_FID" | "NO_PLAN"
}

const PREMIUM_ACTIONS = {
  "COMMUNITY": "Do anything related to joining super community",
  "SUPERANON": "Do anything related to superanon",
  "MANY_ACCOUNTS": "Connect or create another account",
}

const GUEST_ACTIONS = {
  "READ_LISTS": "Read lists of the guest user",
  "READ_FEED": "Read feed of the guest user",
  "READ_SEARCH": "Read search of the guest user",
}

const DEFAULT_GUEST_USER_FID = Number(process.env.DEFAULT_GUEST_USER_FID)

type PREMIUM_ACTION = keyof typeof PREMIUM_ACTIONS
type GUEST_ACTION = keyof typeof GUEST_ACTIONS

export const isAuthorized = async (
  supercastUser: SupercastPrivyUser,
  requestedFid: number,
  signerRequired: boolean = false,
  requestedPremiumAction: PREMIUM_ACTION | null = null,
  requestedGuestAction: GUEST_ACTION | null = null,
): Promise<AuthorizationResponseData> => {

  try {
    if (!!requestedGuestAction) {
      if (requestedFid === DEFAULT_GUEST_USER_FID) {
        return {
          authorized: true,
          farcasterAccount: null,
          error_message: ""
        }
      }
    }

    if (!requestedFid) {
      return {
        authorized: false,
        farcasterAccount: null,
        error_message: "NO_TARGET_FID"
      }
    }

    if (requestedPremiumAction && supercastUser.plan === PLAN.FREE) {
      return {
        authorized: false,
        farcasterAccount: null,
        error_message: "NO_PLAN"
      }
    }

    const supercastFarcasterAccount = await prisma.supercastFarcasterAccount.findUnique({
      where: {
        fid: requestedFid
      }
    });

    if (!supercastFarcasterAccount) {
      return {
        authorized: false,
        farcasterAccount: null,
        error_message: "NO_FARCASTER_ACCOUNT"
      }
    }

    let hasAccess = false;

    if (supercastUser.fid === requestedFid || (supercastUser.plan === PLAN.PERSONAL && requestedFid == Number(process.env.NEXT_PUBLIC_SUPERANON_FID))) {
      hasAccess = true;
    }

    // check if there exists a connection between the two users

    const connectedAccount = await prisma.connectedAccount.findFirst({
      where: {
        SupercastPrivyUser: supercastUser,
        SupercastFarcasterAccount: supercastFarcasterAccount
      }
    });

    if (!!connectedAccount) {
      hasAccess = true;
    }

    if (!hasAccess) {
      // check shared accounts
      const sharedAccount = await prisma.sharedAccount.findFirst({
        where: {
          SupercastFarcasterAccount: supercastFarcasterAccount,
          sharedWith: supercastUser
        }
      });

      if (!!sharedAccount) {
        hasAccess = true;
      }
    }

    if (hasAccess) {
      if (signerRequired && !supercastFarcasterAccount.signerUUID) {
        return {
          authorized: false,
          farcasterAccount: null,
          error_message: "NO_SIGNER_APPROVED"
        }
      }

      return {
        authorized: true,
        farcasterAccount: supercastFarcasterAccount,
        error_message: ""
      }

    }

    return {
      authorized: false,
      farcasterAccount: null,
      error_message: "NO_ACCESS"
    }
  } catch (error) {

    console.log(`Authorization failed with error ${error}.`);

    return {
      authorized: false,
      farcasterAccount: null,
      error_message: "NO_ACCESS"
    }
  }
}