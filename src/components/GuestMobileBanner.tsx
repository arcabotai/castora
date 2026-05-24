'use client'

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import { Card } from "@/components/ui/card"
import { useIosPwa } from "@/providers/iOSPwaProvider"
import { useState, useEffect } from "react"

const BANNER_HIDDEN_KEY = 'guest-banner-hidden-until'
const HIDE_DURATION = 10 * 60 * 1000 // 10 minutes in milliseconds

export default function GuestMobileBanner() {
  const router = useRouter()
  const { isIosPwa } = useIosPwa();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const hiddenUntil = localStorage.getItem(BANNER_HIDDEN_KEY)
    if (!hiddenUntil || new Date().getTime() > parseInt(hiddenUntil)) {
      setShowBanner(true)
      localStorage.removeItem(BANNER_HIDDEN_KEY)
    }
  }, [])

  const handleHideBanner = () => {
    const hideUntil = new Date().getTime() + HIDE_DURATION
    localStorage.setItem(BANNER_HIDDEN_KEY, hideUntil.toString())
    setShowBanner(false)
  }

  return (
    <Card className={`lg:hidden ${isIosPwa ? 'bottom-[88px]' : 'bottom-16'} fixed left-2 right-2 px-4 py-2 ${showBanner ? 'block' : 'hidden'} shadow-md`}>
      <div className="flex flex-col items-center justify-center gap-2">
        <p className="text-xs text-gray-500">
          You are using super as a guest
        </p>
        <Button
          onClick={() => router.push('/onboarding')}
          className="w-full"
        >
          Create profile
        </Button>
        <Button
          variant="outline"
          onClick={handleHideBanner}
          className="w-full"
        >
          Keep exploring
        </Button>
      </div>
    </Card>
  )
} 