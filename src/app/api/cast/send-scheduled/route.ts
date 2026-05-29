import type { NextRequest } from 'next/server';
import { isCronAuthorized } from '@/utils/auth/requireCronAuth';

export const maxDuration = 240;

export function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json(
    { success: false, error: 'sendScheduledCasts worker is disabled in Castora bootstrap' },
    { status: 501 },
  );
}
