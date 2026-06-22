import { isAuthInfrastructureError } from './AuthInfrastructureError'

/**
 * If `error` is an auth infrastructure failure (DB/Privy unreachable), returns a
 * retryable 503 Response; otherwise returns `null` so the caller can rethrow or
 * handle it itself.
 *
 * Use this in route handlers that the client relies on to determine sign-in state
 * (e.g. `user/state`) so a transient outage degrades to "retry" instead of a 401
 * that would sign a real user out and drop them into guest onboarding:
 *
 *   try {
 *     const { authenticated, supercastUser } = await isAuthenticated(req)
 *     // ...
 *   } catch (error) {
 *     return authInfraResponse(error) ?? Promise.reject(error)
 *   }
 *
 * Routes that don't opt in will simply surface the thrown error as a generic 500 —
 * still honest and retryable, and crucially never a false 401.
 */
export const authInfraResponse = (error: unknown): Response | null => {
  if (!isAuthInfrastructureError(error)) return null

  return Response.json(
    { error: 'Service temporarily unavailable. Please retry.' },
    { status: 503, headers: { 'Retry-After': '5' } },
  )
}

/**
 * Wraps a route handler so an `AuthInfrastructureError` (DB/Privy unreachable)
 * surfaces as a retryable 503 instead of a generic 500. Any other error is
 * rethrown unchanged (Next.js renders it as 500). Apply to routes the client
 * relies on for sign-in/timeline state so a transient outage degrades to "retry":
 *
 *   export const GET = withAuthInfra(async (req: Request) => { ... })
 */
export const withAuthInfra =
  <Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) =>
  async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (error) {
      const infra = authInfraResponse(error)
      if (infra) return infra
      throw error
    }
  }
