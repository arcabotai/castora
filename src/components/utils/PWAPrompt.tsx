'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { X, Share2, Download } from 'lucide-react'
import { usePWAPrompt } from '@/providers/PWAPromptProvider'
import { ArrowUpOnSquareIcon } from '@heroicons/react/24/outline'
import { usePrivy } from '@privy-io/react-auth'

export default function PWAPrompt() {
  const { ready: privyUserReady, authenticated } = usePrivy()
  const { isOpenPWAPrompt, setIsOpenPWAPrompt } = usePWAPrompt()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'other'>('other')
  const isMobile = useMediaQuery("(max-width: 640px)")

  const checkAndShowPrompt = () => {
    const lastReminder = localStorage.getItem('lastPWAPromptReminder')
    const now = new Date().getTime()

    if (!lastReminder || now - parseInt(lastReminder) > 7 * 24 * 60 * 60 * 1000) {
      // if (!lastReminder || now - parseInt(lastReminder) > 10 * 1000) {
      setIsOpenPWAPrompt(true)
      localStorage.setItem('lastPWAPromptReminder', now.toString())
    }
  }

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Detect platform
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setPlatform('ios')
    } else if (/android/i.test(userAgent)) {
      setPlatform('android')
    } else if (!/mobile/i.test(userAgent)) {
      setPlatform('desktop')
    }

    if (privyUserReady && authenticated && (platform === 'ios' || platform === 'android')) {
      checkAndShowPrompt()
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    }
    setIsOpenPWAPrompt(false)
  }

  const renderContent = () => (
    <>
      <div className="space-y-4">
        {platform === 'ios' && (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              <p>1. Tap the share button</p>
              <ArrowUpOnSquareIcon className="h-5 w-5" />
            </div>
            <div className="flex items-center space-x-2">
              <p>2. Scroll and tap &quot;Add to Home Screen&quot;</p>
            </div>
          </div>
        )}
        {platform === 'android' && (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              <p>1. Open the settings menu</p>
            </div>
            <div className="flex items-center space-x-2">
              <p>2. Tap &quot;Add to Home Screen&quot; or &quot;Install app&quot;</p>
            </div>
          </div>
        )}
        {platform === 'desktop' && (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              <p>Click the install button in your browser&apos;s address bar</p>
              <Download className="h-5 w-5" />
            </div>
          </div>
        )}
        {platform === 'other' && (
          <p>Install Castora as a Progressive Web App for the best experience on your device</p>
        )}
      </div>
      <div className="flex justify-end space-x-2">
        {deferredPrompt && (
          <Button onClick={handleInstall}>
            Install
          </Button>
        )}
      </div>
    </>
  )

  if (isInstalled) {
    return null
  }

  return (
    <>
      {isMobile ? (
        <Drawer open={isOpenPWAPrompt} onOpenChange={setIsOpenPWAPrompt}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Add Castora to your homescreen</DrawerTitle>
              <DrawerDescription>Castora works best as a mobile app installed on your device.</DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              {renderContent()}
            </div>
            <DrawerFooter>
              <Button variant="ghost" onClick={() => setIsOpenPWAPrompt(false)}>
                Close
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpenPWAPrompt} onOpenChange={setIsOpenPWAPrompt}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to your dock</DialogTitle>
              <DialogDescription>Castora works best as a desktop app installed on your device.</DialogDescription>
            </DialogHeader>
            {renderContent()}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}