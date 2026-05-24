import type { NextRequest } from 'next/server';
import { sendScheduledCasts } from '@/scripts/sendScheduledCasts';

export const maxDuration = 240;

export function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  sendScheduledCasts();

  return Response.json({ success: true });
}