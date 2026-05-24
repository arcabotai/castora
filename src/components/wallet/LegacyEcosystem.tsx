'use client'

import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import FeedHeader from '../FeedHeader'
import { truncateEthAddress } from '@/utils/textUtils'
import { Button } from '../ui/button'
import { ArrowUpRightIcon, CopyIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useDraftComposeWindow } from '@/providers/DraftComposeWindowProvider'
import { useDraftId } from '@/providers/DraftIdProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import DegenWidget from '../ecosystem/DegenWidget'
import MoxieWidget from '../ecosystem/MoxieWidget'



export default function LegacyEcosystem() {

  return (
    <div className="pt-12 lg:pt-0">
      <FeedHeader title="Ecosystem" />
      <div className="flex flex-col gap-y-4 px-4 sm:px-6 lg:px-8">
        <DegenWidget />
        <MoxieWidget />
      </div>
    </div>
  )
}

