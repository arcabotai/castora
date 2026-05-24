import type { NextRequest } from 'next/server';

export const maxDuration = 240;

export function GET(_request: NextRequest) {
  return Response.json(
    { success: false, error: 'sendScheduledCasts worker is disabled in Castora bootstrap' },
    { status: 501 },
  );
}
