import type { NextRequest } from 'next/server';

export const maxDuration = 240;

export async function GET(_request: NextRequest) {
  return Response.json(
    { success: false, error: 'cancelExpiredSubscriptions worker is disabled in Castora bootstrap' },
    { status: 501 },
  );
}
