import type { NextRequest } from 'next/server';
import { sendScheduledDrafts } from '@/scripts/sendScheduledDrafts';

export const maxDuration = 240;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.NEXT_PUBLIC_VERCEL_ENV == 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  await sendScheduledDrafts();

  return Response.json({ success: true });
}