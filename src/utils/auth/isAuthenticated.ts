import { prisma } from '@/prisma/client'
import { SupercastPrivyUser } from '@prisma/client';
import { PrivyClient } from '@privy-io/server-auth';
import { trackPosthogEvent } from '../posthogAnalytics';
import { getBearerToken } from './getBearerToken';
import { AuthInfrastructureError } from './AuthInfrastructureError';

type AuthenticationResponseData = {
  authenticated: boolean,
  supercastUser: SupercastPrivyUser | null
}

// HTTP statuses (from Privy or any wrapped HTTP error) that mean the request/token
// was *rejected* — a genuine auth failure — rather than the service being down.
const CLIENT_AUTH_STATUSES = new Set([400, 401, 403, 404]);

// jose error codes that mean the JWT itself is bad → a genuine auth failure.
// (Privy's verifyAuthToken validates the token with jose under the hood.)
const JWT_AUTH_ERROR_CODES = new Set([
  'ERR_JWT_EXPIRED',
  'ERR_JWT_INVALID',
  'ERR_JWT_CLAIM_VALIDATION_FAILED',
  'ERR_JWS_INVALID',
  'ERR_JWS_SIGNATURE_VERIFICATION_FAILED',
  'ERR_JWE_INVALID',
  'ERR_JOSE_NOT_SUPPORTED',
]);

// Node/undici/jose error codes that signal a dependency is unreachable → infra.
// (Note: verifyAuthToken may fetch the signing key over the network on a cold
// instance, so a network failure there is infra, not a bad token.)
const NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
  'ECONNABORTED',
  'ERR_JWKS_TIMEOUT',
  'ERR_JWKS_NO_MATCHING_KEY',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
]);

type AuthErrorKind = 'auth' | 'infra' | 'unknown';

/**
 * Classify an error thrown while authenticating:
 *  - 'auth'  → the token/request was genuinely rejected (caller returns 401)
 *  - 'infra' → a dependency (Privy API or the database) is unreachable; this is a
 *              transient outage and must NOT be reported as "not authenticated"
 *  - 'unknown' → can't tell; the caller applies a per-stage default
 */
const classifyAuthError = (error: any): AuthErrorKind => {
  const status =
    typeof error?.status === 'number' ? error.status :
    typeof error?.response?.status === 'number' ? error.response.status :
    undefined;
  if (status !== undefined) return CLIENT_AUTH_STATUSES.has(status) ? 'auth' : 'infra';

  const type = error?.type;
  if (type === 'client_error') return 'auth';
  if (type === 'api_error') return 'infra';

  const code = typeof error?.code === 'string' ? error.code : '';
  if (JWT_AUTH_ERROR_CODES.has(code)) return 'auth';
  if (NETWORK_ERROR_CODES.has(code)) return 'infra';

  return 'unknown';
};

const trackAuthEvent = (req: Request, event: 'auth_error' | 'auth_infra_error', error: any) => {
  trackPosthogEvent(parseInt(req.headers.get('asFid') || '0'), event, {
    error_type: error?.name,
    error_message: JSON.stringify(error?.message),
  });
};

const notAuthenticated: AuthenticationResponseData = { authenticated: false, supercastUser: null };

const infraError = (error: unknown) =>
  new AuthInfrastructureError(
    'Authentication is temporarily unavailable (Privy API or database unreachable).',
    { cause: error },
  );

export const isAuthenticated = async (req: Request): Promise<AuthenticationResponseData> => {

  const privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID, process.env.PRIVY_SECRET_KEY);

  const authToken = getBearerToken(req);

  if (!authToken) {
    return notAuthenticated;
  }

  // Stage 1 — verify the token. This is normally an offline cryptographic check,
  // so a failure here usually means the token is missing/expired/tampered: a
  // genuine auth failure. But verifyAuthToken may fetch the signing key over the
  // network on a cold instance, so a *recognised* infra error (network/5xx/JWKS
  // timeout) is surfaced as retryable instead. Default for anything ambiguous:
  // treat as an auth failure, preserving the prior 401 behaviour for bad tokens.
  let verifiedClaims: Awaited<ReturnType<typeof privy.verifyAuthToken>>;
  try {
    verifiedClaims = await privy.verifyAuthToken(authToken);
  } catch (error) {
    if (classifyAuthError(error) === 'infra') {
      trackAuthEvent(req, 'auth_infra_error', error);
      console.error('isAuthenticated: infrastructure failure verifying token (Privy unreachable):', error);
      throw infraError(error);
    }
    trackAuthEvent(req, 'auth_error', error);
    console.log(`Token verification failed with error ${error}.`);
    return notAuthenticated;
  }

  // Stage 2 — resolve the user via the Privy API (network) and our database. A
  // throw here is almost always an INFRASTRUCTURE failure (Privy outage or the
  // database being unreachable), NOT an auth failure. We must NOT collapse it to
  // "not authenticated": a transient blip would then empty the timeline and drop a
  // real, signed-in user into guest / connect-account onboarding (which, on shared
  // dev==prod data, can write duplicate records). Surface it as an
  // AuthInfrastructureError so routes can return a retryable 503. Default for
  // anything ambiguous: treat as infra; only a *recognised* client/auth rejection
  // (Privy 4xx) is reported as not-authenticated.
  try {
    const user = await privy.getUser(verifiedClaims.userId);

    const supercastPrivyUser = await prisma.supercastPrivyUser.findUnique({
      where: {
        privyUserId: user.id
      }
    });

    if (!supercastPrivyUser) {
      // Token is valid but this Privy user hasn't connected a Castora account yet
      // — a genuine "guest" state, not an error.
      return notAuthenticated;
    }

    return {
      authenticated: true,
      supercastUser: supercastPrivyUser
    }

  } catch (error) {

    if (classifyAuthError(error) === 'auth') {
      trackAuthEvent(req, 'auth_error', error);
      console.log(`Privy rejected the user with error ${error}.`);
      return notAuthenticated;
    }

    trackAuthEvent(req, 'auth_infra_error', error);
    console.error('isAuthenticated: infrastructure failure resolving user (Privy API or database unreachable):', error);
    throw infraError(error);
  }
}
