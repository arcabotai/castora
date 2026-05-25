// app/providers.js
'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

if (typeof window !== 'undefined' && posthogKey) {
  posthog.init(posthogKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    autocapture: false,
  })
}

export function CSPostHogProvider({ children }) {
  if (!posthogKey) {
    return children
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
