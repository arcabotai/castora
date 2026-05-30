import type { NextRequest } from 'next/server';
import { isCronAuthorized } from '@/utils/auth/requireCronAuth';
import { sendScheduledCasts } from '@/scripts/sendScheduledCasts';

export const maxDuration = 240;

// Reconstructed scheduled-cast sender (the ScheduledCast table). OFF by default
// and NOT wired into vercel.json crons, so it never runs automatically and posts
// nothing until deliberately enabled. To turn on: set
// CASTORA_ENABLE_SCHEDULED_SENDER=true and add a cron entry to vercel.json.
// Always requires CRON_SECRET — Vercel attaches it to cron invocations.
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (process.env.CASTORA_ENABLE_SCHEDULED_SENDER !== 'true') {
    return Response.json(
      { success: false, error: 'scheduled sender disabled (set CASTORA_ENABLE_SCHEDULED_SENDER=true to enable)' },
      { status: 503 },
    );
  }

  const result = await sendScheduledCasts();
  return Response.json({ success: true, ...result });
}
