/**
 * Thrown by `isAuthenticated` when authentication cannot be determined because an
 * underlying dependency is unreachable — the Privy API or the database — as
 * opposed to a genuine "this token is invalid" auth failure.
 *
 * Why this exists: the auth check used to wrap token verification AND the Privy/DB
 * lookups in a single try/catch that returned `{ authenticated: false }` on ANY
 * error. So a transient Railway Postgres blip made every data route report "not
 * authenticated" → empty timeline → real users dropped into guest / connect-account
 * onboarding. Because dev and prod share one database, that onboarding could even
 * write duplicate records into production.
 *
 * The fix: a transient infrastructure failure must NEVER be reported to the client
 * as "not authenticated" (401). Routes should surface this as a retryable 503 so the
 * client retries instead of signing the user out. See `authInfraResponse`.
 */
export class AuthInfrastructureError extends Error {
  /** HTTP status routes should use when surfacing this error. */
  readonly status = 503 as const

  constructor(message: string, options?: { cause?: unknown }) {
    super(message)
    this.name = 'AuthInfrastructureError'
    // Preserve the original error for logging without depending on the ES2022
    // `Error.cause` constructor option (kept compatible with older TS targets).
    if (options?.cause !== undefined) {
      ;(this as { cause?: unknown }).cause = options.cause
    }
  }
}

/**
 * Type guard for `AuthInfrastructureError`. Also duck-types by `name` so it still
 * works if the class is duplicated across module/bundle boundaries.
 */
export const isAuthInfrastructureError = (
  error: unknown,
): error is AuthInfrastructureError =>
  error instanceof AuthInfrastructureError ||
  (typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AuthInfrastructureError')
