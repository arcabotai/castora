const DEFAULT_APP_URL = 'https://castora.arcabot.ai';

const VERCEL_ENV_HOST_URLS: Record<string, string> = {
  production: process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL,
  preview: process.env.NEXT_PUBLIC_APP_URL || 'https://castora-tan.vercel.app',
  development: 'http://localhost:3000',
};

const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || 'development';

export const HOST_URL = VERCEL_ENV_HOST_URLS[environment] || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;
