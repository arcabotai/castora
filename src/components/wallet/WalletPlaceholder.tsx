'use client'

import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { useCreateWallet, usePrivy } from '@privy-io/react-auth'
import FeedHeader from '../FeedHeader'
import { truncateEthAddress } from '@/utils/textUtils'
import { Button } from '../ui/button'
import { ArrowRightIcon, CopyIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useDraftComposeWindow } from '@/providers/DraftComposeWindowProvider'
import { useDraftId } from '@/providers/DraftIdProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSolanaWallets } from '@privy-io/react-auth/solana';


export default function WalletPlaceholder() {
  const { isRegularUser, isGuest } = useSupercastUserState()
  const { user, ready: privyReady, authenticated } = usePrivy()
  const { createWallet: createEthereumWallet } = useCreateWallet()
  const router = useRouter()

  const { wallets: solanaWallets, createWallet: createSolanaWallet, ready: solanaReady } = useSolanaWallets();

  const { setOpenDraftComposeWindow, setInitialText, setInitialEmbeds, setInitialRecastId } = useDraftComposeWindow()
  const { setDraftId } = useDraftId()

  const cardRef = useRef<HTMLDivElement>(null)
  const triedEthereumWalletCreation = useRef(false)
  const triedSolanaWalletCreation = useRef(false)
  const [walletSetupError, setWalletSetupError] = useState<string | null>(null)

  const ethereumAddress = user?.wallet?.address
  const solanaAddress = solanaWallets[0]?.address

  const copyAddress = async (address?: string) => {
    if (!address) {
      toast.error("Wallet address is still being created")
      return
    }

    await navigator.clipboard.writeText(address)
    toast.success("Full address copied to clipboard")
  }

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
    if (privyReady && authenticated && !ethereumAddress && !triedEthereumWalletCreation.current) {
      triedEthereumWalletCreation.current = true
      createEthereumWallet()
        .then(() => setWalletSetupError(null))
        .catch((error) => {
          console.error('Error creating embedded Ethereum wallet:', error)
          setWalletSetupError('Wallet setup is still pending. Refresh in a moment if the address does not appear.')
        })
    }
  }, [privyReady, authenticated, ethereumAddress, createEthereumWallet])

  useEffect(() => {
    if (privyReady && authenticated && solanaReady && !solanaAddress && !triedSolanaWalletCreation.current) {
      triedSolanaWalletCreation.current = true
      createSolanaWallet()
        .then(() => setWalletSetupError(null))
        .catch((error) => {
          console.error('Error creating embedded Solana wallet:', error)
          setWalletSetupError('Wallet setup is still pending. Refresh in a moment if the address does not appear.')
        })
    }
  }, [privyReady, authenticated, solanaReady, solanaAddress, createSolanaWallet])

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
                onClick={() => copyAddress(ethereumAddress)}>
                <p className="text-sm text-white/80">
                  {ethereumAddress ? truncateEthAddress(ethereumAddress) : "Creating EVM wallet..."}
                </p>
                {ethereumAddress && <CopyIcon className="w-4 h-4 text-white/80" />}
              </div>
              {solanaAddress ? (
                <div className="flex flex-row items-center gap-1 cursor-pointer"
                  onClick={() => copyAddress(solanaAddress)}>
                  <p className="text-sm text-white/80">{truncateEthAddress(solanaAddress)}</p>
                  <CopyIcon className="w-4 h-4 text-white/80" />
                </div>
              ) : (
                <p className="text-sm text-white/80">Creating Solana wallet...</p>
              )}
              {walletSetupError && <p className="text-xs text-white/75">{walletSetupError}</p>}

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
