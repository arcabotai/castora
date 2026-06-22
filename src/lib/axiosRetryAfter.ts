'use client'

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

let registered = false

// Header marker so a given request is retried at most once. A custom property on
// the config object can be dropped when axios merges config for the retry, which
// would allow an infinite loop on a persistent 503; request headers survive the
// merge, so this reliably caps it at one retry.
const RETRY_MARKER = 'x-castora-503-retried'

/**
 * Registers a single global response interceptor on the default axios instance
 * that honours `Retry-After` on a 503. When the server says "temporarily
 * unavailable" (e.g. the retryable 503 `isAuthenticated`/`withAuthInfra` returns
 * on a DB/Privy blip), this waits the suggested delay and retries the request
 * exactly once before surfacing the error.
 *
 * Safe to call multiple times — it only registers once, and never on the server.
 */
export function registerRetryAfterInterceptor() {
  if (registered || typeof window === 'undefined') return
  registered = true

  axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig | undefined
      const alreadyRetried = !!(config?.headers as any)?.[RETRY_MARKER]

      if (error.response?.status === 503 && config && !alreadyRetried) {
        const retryAfter = error.response.headers?.['retry-after']
        const seconds = retryAfter ? parseInt(String(retryAfter), 10) : NaN
        const delayMs = Number.isFinite(seconds) ? Math.min(seconds * 1000, 10000) : 1000

        await new Promise((resolve) => setTimeout(resolve, delayMs))
        config.headers = { ...(config.headers as any), [RETRY_MARKER]: '1' } as any
        return axios.request(config)
      }

      return Promise.reject(error)
    },
  )
}
