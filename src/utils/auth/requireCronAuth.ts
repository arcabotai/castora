/**
 * Authorize a cron / scheduled-worker request.
 *
 * Vercel automatically attaches `Authorization: Bearer ${CRON_SECRET}` to any
 * route listed under `crons` in vercel.json (when CRON_SECRET is set in the
 * project env). Any other scheduler invoking these endpoints must send the
 * same header.
 *
 * Fails closed: if CRON_SECRET is not configured, this returns false so a
 * misconfiguration can never leave a worker publicly invocable. These routes
 * are currently disabled stubs, but gating them now keeps them secure-by-
 * default for when the workers are re-implemented.
 */
export function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}
