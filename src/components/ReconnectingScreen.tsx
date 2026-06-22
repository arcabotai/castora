'use client'

import { Button } from '@/components/ui/button'

/**
 * Shown when Privy says the user is signed in but /api/user/state couldn't be
 * loaded (a transient 503 / outage). Keeps the user on a retry state instead of
 * silently falling through to the guest / connect-account flow.
 */
export default function ReconnectingScreen({ message }: { message?: string }) {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-gray-600 dark:text-gray-400 max-w-xs">
        {message ?? 'We had trouble reaching Castora. This is usually temporary.'}
      </p>
      <Button onClick={() => window.location.reload()} className="max-w-xs">
        Try again
      </Button>
    </div>
  )
}
