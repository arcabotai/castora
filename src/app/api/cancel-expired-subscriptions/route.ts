import type { NextRequest } from 'next/server';
import { cancelExpiredSubscriptions } from '@/scripts/cancelExpiredSubscriptions';

export const maxDuration = 240;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  await cancelExpiredSubscriptions();

  return Response.json({ success: true });
}