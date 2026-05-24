import { NextResponse, NextRequest } from "next/server";

const VERCEL_ENV_ALLOWED_ORIGINS = {
  'production': 'https://www.super.sc',
  'preview': 'https://devdevdev.super.sc',
  'development': 'http://localhost:3000',
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || 'development';

  // Set the allowed origin
  const allowedOrigin = VERCEL_ENV_ALLOWED_ORIGINS[environment] || 'https://super.sc';

  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set('Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, asFid'
  );

  // Handle preflight requests
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