'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { Bell } from "lucide-react"
import { useHotkeys } from 'react-hotkeys-hook'
import useIsPWA from '@/components/hooks/useIsPWA'
import { registerNotificationSubscription } from '@/utils/notifications'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { toast } from 'sonner'

export default function NotificationReminder() {
  const [showReminder, setShowReminder] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const { supercastUserState, setSuperCastUserState } = useSupercastUserState()
  const isPWA = useIsPWA()

  // todo remove
  useHotkeys('n', () => setShowReminder(true))

  // Check for notification support and PWA status
  useEffect(() => {
    const checkNotificationSupport = () => {
      return 'Notification' in window &&
        Notification.permission !== 'denied' &&
        !/iPhone|iPad|iPod/.test(navigator.userAgent);
    };

    setIsSupported(checkNotificationSupport() || isPWA);
  }, [isPWA])

  // Check for mobile device
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    setIsMobile(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mediaQuery.addEventListener('change', handler)

    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Check reminder timing
  useEffect(() => {
    const checkAndShowReminder = () => {
      const lastReminder = localStorage.getItem('lastNotificationReminder')
      const now = new Date().getTime()

      if (!lastReminder || now - parseInt(lastReminder) > 7 * 24 * 60 * 60 * 1000) {
        // if (!lastReminder || now - parseInt(lastReminder) > 10 * 1000) {
        setShowReminder(true)
        localStorage.setItem('lastNotificationReminder', now.toString())
      }
    }

    checkAndShowReminder()
    const interval = setInterval(checkAndShowReminder, 24 * 60 * 60 * 1000) // Check daily

    return () => clearInterval(interval)
  }, [])

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
        registerNotificationSubscription(supercastUserState)
        toast.success('Push notifications enabled');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Error enabling push notifications!');
    }

    setShowReminder(false);
  }

  const handleDismiss = () => {
    setShowReminder(false)
  }

  // Don't show in production for now
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') return null;

  // Don't show if notifications aren't supported
  if (!isSupported) return null;

  // Optional: Only show in PWA mode
  // if (!isPWA) return null;

  // Don't show if reminder shouldn't be shown
  if (!showReminder) return null;

  if (isMobile) {
    return (
      <Drawer open={showReminder} onOpenChange={setShowReminder}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Enable notifications <Bell className="inline-block ml-1 h-5 w-5" /></DrawerTitle>
          </DrawerHeader>
          <div className="p-4 text-center">
            <p className="mb-1">Get notified when people mention or reply to you.</p>
            <p className="">You can always change your preferences in settings.</p>
          </div>
          <DrawerFooter>
            <Button onClick={handleEnableNotifications}>Enable</Button>
            <Button variant="outline" onClick={handleDismiss}>Maybe Later</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-fit shadow-lg z-[101]">
      <CardHeader>
        <CardTitle>Enable notifications <Bell className="inline-block ml-2 h-6 w-6" /></CardTitle>
      </CardHeader>
      <CardContent>
        <div className="">
          <p className="mb-1">Get notified when people mention or reply to you.</p>
          <p className="">You can always change your preferences in settings.</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-x-4">
        <Button onClick={handleEnableNotifications} className='w-full'>Enable</Button>
        <Button variant="outline" onClick={handleDismiss} className='w-full'>Maybe Later</Button>
      </CardFooter>
    </Card>
  )
}