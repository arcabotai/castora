const DEFAULT_APP_URL = 'https://castora.arcabot.ai';

const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV;
const browserOrigin = typeof window !== 'undefined' ? window.location.origin : undefined;

export const HOST_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  browserOrigin ||
  (environment === 'development' ? 'http://localhost:3000' : DEFAULT_APP_URL);
