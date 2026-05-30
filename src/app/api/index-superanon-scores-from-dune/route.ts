import type { NextRequest } from 'next/server';
import { isCronAuthorized } from '@/utils/auth/requireCronAuth';

export const maxDuration = 240;

/**
 * SHELVED — intentionally disabled, kept in the repo for possible future revival.
 *
 * This indexed Supercast's "Superanon" leaderboard scores from a Dune query.
 * Superanon was a Supercast-only feature; its account (@superanon, fid 862100)
 * has been dormant since 2025-10-28, and the original Dune query was never part
 * of this fork — so there is no live data source to index. The anonymous-posting
 * idea now lives on independently as Anoncast / Anon World ($ANON).
 *
 * Removed from vercel.json crons (no longer scheduled). Revive only if a live
 * scoring source returns. See AGENTS.md (roadmap) for full context.
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json(
    { success: false, error: 'indexSuperanonScoresFromDune is shelved (Superanon dormant; see AGENTS.md)' },
    { status: 501 },
  );
}
