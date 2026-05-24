const VERCEL_ENV_HOST_URLS = {
  'production': 'https://www.super.sc',
  'preview': 'https://devdevdev.super.sc',
  'development': 'http://localhost:3000',
}

const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || 'development';

export const HOST_URL = VERCEL_ENV_HOST_URLS[environment];
