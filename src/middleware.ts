import { NextResponse, NextRequest } from "next/server";

const DEFAULT_APP_URL = 'https://castora.arcabot.ai';

const VERCEL_ENV_ALLOWED_ORIGINS: Record<string, string> = {
  production: process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL,
  preview: process.env.NEXT_PUBLIC_APP_URL || 'https://castora-tan.vercel.app',
  development: 'http://localhost:3000',
};

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || 'development';
  const allowedOrigin = VERCEL_ENV_ALLOWED_ORIGINS[environment] || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, asFid'
  );

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers':
          'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, asFid',
      },
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
