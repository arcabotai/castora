'use client'

import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'

export default function DebugState() {
  const { supercastUserState } = useSupercastUserState()

  if (process.env.NODE_ENV === 'production') return null
  if (process.env.NEXT_PUBLIC_DEBUG_STATE === 'true') return (
    <div className="fixed top-0 right-0 bg-black/80 text-white p-4 m-2 rounded-lg z-50 max-w-[300px] text-xs font-mono">
      <pre>{JSON.stringify(supercastUserState, null, 2)}</pre>
    </div>
  )
}