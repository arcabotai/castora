'use client'

import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import FeedHeader from '../FeedHeader'
import { truncateEthAddress } from '@/utils/textUtils'
import { Button } from '../ui/button'
import { ArrowRightIcon, CopyIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useDraftComposeWindow } from '@/providers/DraftComposeWindowProvider'
import { useDraftId } from '@/providers/DraftIdProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSolanaWallets } from '@privy-io/react-auth/solana';


export default function WalletPlaceholder() {
  const { isRegularUser, isGuest } = useSupercastUserState()
  const { user } = usePrivy()
  const router = useRouter()

  const { wallets: solanaWallets, createWallet, ready: solanaReady } = useSolanaWallets();

  const { setOpenDraftComposeWindow, setInitialText, setInitialEmbeds, setInitialRecastId } = useDraftComposeWindow()
  const { draftId, setDraftId } = useDraftId()

  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const rotateX = ((y - centerY) / centerY) * -5
      const rotateY = ((x - centerX) / centerX) * 5

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
      card.style.transition = 'transform 0.1s'
    }

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
      card.style.transition = 'transform 0.5s'
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  useEffect(() => {
    if (solanaWallets.length === 0 && solanaReady) {
      createWallet();
    }
  }, [solanaWallets, solanaReady]);

  return (
    <div className="pt-12 lg:pt-0 min-h-[calc(100vh-100px)]">
      <FeedHeader title="Wallet" />
      <div id="wallet-card" className="flex flex-col justify-center items-center w-full pt-16 gap-12 px-4 sm:px-6 lg:px-8">
        <div
          ref={cardRef}
          className="relative w-full max-w-md aspect-[3/4] rounded-3xl bg-gradient-to-br from-orange-400 via-rose-400 to-cyan-500 p-8 text-white shadow-2xl transition-transform duration-100"
        >
          <div className="flex flex-col h-full justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-5xl font-semibold">$0.00</h2>
              <div
                className="flex flex-row items-center gap-1 cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(user?.wallet?.address)
                  toast.success("Full address copied to clipboard")
                }}>
                <p className="text-sm text-white/80">{truncateEthAddress(user?.wallet?.address)}</p>
                <CopyIcon className="w-4 h-4 text-white/80" />
              </div>
              {solanaWallets.length > 0 && (
                <div className="flex flex-row items-center gap-1 cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(solanaWallets[0].address)
                    toast.success("Full address copied to clipboard")
                  }}>
                  <p className="text-sm text-white/80">{truncateEthAddress(solanaWallets[0].address)}</p>
                  <CopyIcon className="w-4 h-4 text-white/80" />
                </div>
              )}

            </div>

            <div className="flex flex-col gap-6">
              <h3 className="text-3xl font-semibold">Castora Wallet</h3>
              <p className="text-base sm:text-lg leading-relaxed">
                Automatic airdrop discovery.<br />
                One tap interactions with frames.<br />
                Make the most out of farcaster economy.
              </p>
              {isRegularUser() && (
                <Button
                  className="bg-white text-black hover:bg-white/90 w-full"
                  onClick={() => {
                    const initialText = `I just learned about Castora Wallet. WOW. My mind is blown. Well played @woj.eth.

Automatic airdrop discovery.
One tap interactions with frames.
Making money in farcaster economy.
                    
Castora Wallet is the most egalitarian thing I've ever seen. It's insanely ambitious, and if it works, can really reshape the fabric of society.`
                    setDraftId(null)
                    setOpenDraftComposeWindow(true)
                    setInitialText(initialText)
                    setInitialEmbeds([])
                    setInitialRecastId(null)
                  }}
                >
                  Coming soon
                </Button>
              )}
              {isGuest() && (
                <Button
                  className="bg-white text-black hover:bg-white/90 w-full"
                  onClick={() => router.push('/onboarding')}
                >
                  Create profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Link href="/ecosystem" className="flex flex-col items-center mt-20">
        <Button
          className="w-full"
          variant="link"
        >
          Legacy ecosystem integrations
          <ArrowRightIcon className="w-4 h-4 ml-1" />
        </Button>
        <p className="text-xs text-gray-500">(They will get much better with Castora Wallet)</p>
      </Link>
    </div>
  )
}
