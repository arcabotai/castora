import type { NextRequest } from 'next/server';
import { indexSuperanonScoresFromDune } from '@/scripts/indexSuperanonScoresFromDune';

export const maxDuration = 240;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  // input yesterdays date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toISOString().split('T')[0];

  await indexSuperanonScoresFromDune(yesterdayFormatted);

  return Response.json({ success: true });
}