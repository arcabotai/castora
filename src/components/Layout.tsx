'use client'

import { Toaster } from 'sonner'
import { useMobileSidebar } from '@/providers/MobileSidebarProvider'
import { useImageInFocus } from '@/providers/ImageInFocusProvider'
import ImageModal from './ImageModal'
import { usePrivy } from '@privy-io/react-auth'
import LandingPage from './LandingPage'
import PulsingSupercastLogo from './PulsingSupercastLogo'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import DraftComposeWindow from './casts/DraftComposeWindow'
import MobileNavbar from './navigation/MobileNavbar'
import CastDetailFullScreen from './casts/CastDetailFullScreen'
import { useFeedRefresh } from '@/providers/FeedRefreshProvider'
import DesktopSidebar from './navigation/DesktopSidebar'
import MobileSidebar from './navigation/MobileSidebar'
import { useConfetti } from '@/contexts/ConfettiContext'
import ListDetail from './lists/ListDetail'
import NavigationHotkeys from './navigation/NavigationHotkeys'
import HotkeyShortcutWindow from './navigation/HotkeyShortcutWindow'
import dynamic from 'next/dynamic'
import DebugState from './debug/DebugState'

const CheckoutDialog = dynamic(
  () => import('./checkout/CheckoutDialog').then((mod) => mod.CheckoutDialog),
  { ssr: false }
)
import GuestMobileBanner from './GuestMobileBanner'

const ALWAYS_ACCESSIBLE_PAGES = ["Cast", "Profile", "Channel"];
const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true';

export default function Layout({ currentTab, main, rightColumn }: { currentTab: string, main: React.ReactNode, rightColumn: React.ReactNode }) {
  const { openSidebar, setOpenSidebar } = useMobileSidebar()
  const {
    open: openImageInFocus,
    setOpen: setOpenImageInFocus,
    image: imageInFocus,
    setImage: setImageInFocus
  } = useImageInFocus()
  const { supercastUserState, isAuthenticated, isGuest } = useSupercastUserState()
  const { refreshFeed, isRefreshing } = useFeedRefresh()
  const { ConfettiComponent } = useConfetti()

  const { ready: privyUserReady, authenticated } = usePrivy();

  const handleRefresh = async (e: React.MouseEvent) => {
    if (currentTab === 'Home') {
      e.preventDefault()
      try {
        await refreshFeed()
      } catch (error) {
        console.error('Error refreshing feed:', error)
      }
    }
  }

  if (!privyUserReady) {
    // Do nothing while the PrivyProvider initializes with updated user state
    return <PulsingSupercastLogo />
  }

  if (!isAuthenticated() && !ALWAYS_ACCESSIBLE_PAGES.includes(currentTab)) {
    return <LandingPage />;
  }

  if (!supercastUserState) {
    return <PulsingSupercastLogo />
  }

  return (
    <>
      <Toaster richColors expand={true} closeButton />
      <DebugState />
      <ImageModal open={openImageInFocus} setOpen={setOpenImageInFocus} image={imageInFocus} />
      <DraftComposeWindow />
      <HotkeyShortcutWindow />
      <CastDetailFullScreen />
      <ListDetail isColumn={false} />
      <ConfettiComponent />
      <NavigationHotkeys />
      {PAYMENTS_ENABLED && <CheckoutDialog />}
      <div className='w-full flex flex-col justify-center items-center min-h-screen max-h-screen lg:max-h-none'>
        <div className='w-full lg:w-screen max-w-screen-xl lg:flex lg:flex-row relative overflow-auto overscroll-none flex-grow'>

          <MobileSidebar
            openSidebar={openSidebar}
            setOpenSidebar={setOpenSidebar}
            currentTab={currentTab}
          />

          <DesktopSidebar
            currentTab={currentTab}
            supercastUserState={supercastUserState}
            handleRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />

          <main className="lg:w-3/6 overflow-hidden w-full">
            <div className="sm:border-x border-gray-200 dark:border-gray-800 max-w-full lg:min-h-screen">
              {main}
            </div>
          </main>

          <aside className="hidden lg:w-2/6 lg:flex lg:flex-col">
            {rightColumn}
          </aside>
        </div>
        {isGuest() && <GuestMobileBanner />}
        {isAuthenticated() && <MobileNavbar currentTab={currentTab} />}
      </div>
    </>
  )
}