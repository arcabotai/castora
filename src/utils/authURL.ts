const DEFAULT_APP_URL = 'https://castora.social';

const VERCEL_ENV_AUTH_URLS: Record<string, string> = {
  production: process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL,
  preview: process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL,
  development: 'http://localhost:3001',
};

const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || 'development';

export const AUTH_URL = VERCEL_ENV_AUTH_URLS[environment] || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;
