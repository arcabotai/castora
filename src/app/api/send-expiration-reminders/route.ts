import type { NextRequest } from 'next/server';
import { sendExpirationReminders } from '@/scripts/sendExpirationReminders';

export const maxDuration = 240;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  await sendExpirationReminders();

  return Response.json({ success: true });
}