const VERCEL_ENV_AUTH_URLS = {
  'production': 'https://auth.super.sc',
  'preview': 'https://devdevdev.auth.super.sc',
  'development': 'http://localhost:3001',
}

const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || 'development';

export const AUTH_URL = VERCEL_ENV_AUTH_URLS[environment];
