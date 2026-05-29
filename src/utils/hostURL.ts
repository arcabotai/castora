const DEFAULT_APP_URL = 'https://castora.social';

const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV;
const browserOrigin = typeof window !== 'undefined' ? window.location.origin : undefined;

// On the client, always use the origin the app is actually served from
// (localhost, a preview URL, or production). This keeps API calls same-origin
// and avoids the CORS failures that happen when a hardcoded prod URL is used
// during local dev or preview deploys. On the server (no window), fall back to
// the configured app URL, then localhost in dev, then the production default.
export const HOST_URL =
  browserOrigin ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (environment === 'development' ? 'http://localhost:3000' : DEFAULT_APP_URL);
