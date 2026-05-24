import { prisma } from "@/prisma/client";
import { Draft, DRAFT_SEND_STATUS, PLAN, SUPERANON_BAN_LEVEL, SupercastPrivyUser } from "@prisma/client";

type ValidationResult = {
  isValid: boolean;
  errorMessage: "ANON_INVALID_CONTENT_TICKER"
  | "ANON_INVALID_CONTENT_ETH"
  | "ANON_INVALID_CONTENT_SOL"
  | "ANON_INVALID_CONTENT_MENTION"
  | "ANON_INVALID_CONTENT_URL"
  | "ANON_USER_BANNED"
  | "ANON_EMPTY_QUOTE"
  | "ANON_RATE_LIMITED"
  | "ANON_NO_PLAN"
}

const FORBIDDEN_MENTIONS = [
  "clanker",
  "heyterminal",
  "bogusbob",
  "wowza",
  "netprotocol",
  "beliefs",
  "wememe"
];

const FORBIDDEN_DOMAINS = [
  "wow.xyz",
  "pump.fun",
  "dexscreener.com",
  "clanker.world",
  "geckoterminal.com",
  "t.me",
];

type Embed = {
  cast_id?: string
  url?: string
}

type DraftFull = Draft & {
  embeds: Embed[]
  creator: SupercastPrivyUser
}

export async function isValidAnonPost(draft: DraftFull): Promise<ValidationResult> {

  if (draft.creator.plan === PLAN.FREE) {
    return {
      isValid: false,
      errorMessage: "ANON_NO_PLAN"
    }
  }

  // Check for stock/crypto tickers
  const containsTickers = /\$[A-Za-z]+/.test(draft.text);
  if (containsTickers) {
    return {
      isValid: false,
      errorMessage: "ANON_INVALID_CONTENT_TICKER"
    };
  }

  // Check for Ethereum addresses
  const containsEthAddress = /0x[a-fA-F0-9]{40}/.test(draft.text);
  if (containsEthAddress) {
    return {
      isValid: false,
      errorMessage: "ANON_INVALID_CONTENT_ETH"
    };
  }

  // Check for Solana addresses
  const containsSolAddress = /[1-9A-HJ-NP-Za-km-z]{32,44}/.test(draft.text);
  if (containsSolAddress) {
    return {
      isValid: false,
      errorMessage: "ANON_INVALID_CONTENT_SOL"
    };
  }

  // Check for forbidden mentions
  if (FORBIDDEN_MENTIONS.some(mention => draft.text.toLowerCase().includes(`@${mention.toLowerCase()}`))) {
    return {
      isValid: false,
      errorMessage: "ANON_INVALID_CONTENT_MENTION"
    };
  }

  // Check for forbidden URLs (handles different protocols and parameters)
  const urlRegex = new RegExp(
    FORBIDDEN_DOMAINS.map(domain =>
      `(?:https?:\/\/)?(?:www\.)?${domain.replace('.', '\\.')}(?:\/[^\s]*)?`
    ).join('|'),
    'i'
  );

  if (urlRegex.test(draft.text)) {
    return {
      isValid: false,
      errorMessage: "ANON_INVALID_CONTENT_URL"
    };
  }

  if (draft.text.length === 0 && draft.embeds.length === 1 && !!draft.embeds[0].cast_id) {
    return {
      isValid: false,
      errorMessage: "ANON_EMPTY_QUOTE"
    };
  }

  const ban = await prisma.superanonBan.findUnique({
    where: {
      supercastPrivyUserId: draft.creator.id,
      level: SUPERANON_BAN_LEVEL.BANNED
    }
  })

  if (!!ban) {
    return {
      isValid: false,
      errorMessage: "ANON_USER_BANNED"
    }
  }

  const lastAnonDraft = await prisma.draft.findFirst({
    where: {
      creatorId: draft.creator.id,
      sendStatus: DRAFT_SEND_STATUS.SENT,
      isTopLevel: true,
      OR: [
        { isAnon: true },
        { author: { fid: Number(process.env.NEXT_PUBLIC_SUPERANON_FID) } }
      ]
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  if (draft.isTopLevel && lastAnonDraft && lastAnonDraft.createdAt > new Date(Date.now() - 1 * 60 * 60 * 1000)) {
    return {
      isValid: false,
      errorMessage: "ANON_RATE_LIMITED"
    }
  }

  return {
    isValid: true,
    errorMessage: null
  };
}