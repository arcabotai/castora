'use client'

import FeedHeader from '../FeedHeader'
import { Button } from '../ui/button'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { cn } from '@/lib/utils'
import {
  useCreateWallet,
  useFundWallet,
  usePrivy,
  useSetWalletRecovery,
  useWallets,
} from '@privy-io/react-auth'
import {
  useFundWallet as useFundSolanaWallet,
  useSolanaWallets,
} from '@privy-io/react-auth/solana'
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  KeyRound,
  Link2,
  Plus,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { formatEther } from 'viem'

const BASE_RPC_URL = 'https://mainnet.base.org'
const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com'

type BalanceState = {
  evm?: string
  solana?: string
  loading: boolean
  error?: string | null
  updatedAt?: number
}

type WalletCardProps = {
  address?: string
  balance?: string
  chainLabel: string
  description: string
  explorerHref?: string
  isCreating: boolean
  onCopy: () => void
  onCreate: () => void
  onFund: () => void
  canFund: boolean
}

const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

const formatTokenAmount = (amount: string, symbol: string) => {
  const numericAmount = Number(amount)

  if (!Number.isFinite(numericAmount)) {
    return `${amount} ${symbol}`
  }

  const maximumFractionDigits = numericAmount > 0 && numericAmount < 0.001 ? 6 : 4

  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(numericAmount)} ${symbol}`
}

async function fetchBaseEthBalance(address: string) {
  const response = await fetch(BASE_RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'castora-wallet-base-balance',
      method: 'eth_getBalance',
      params: [address, 'latest'],
    }),
  })

  const payload = await response.json()

  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message || 'Unable to load Base balance')
  }

  return formatTokenAmount(formatEther(BigInt(payload.result)), 'ETH')
}

async function fetchSolanaBalance(address: string) {
  const response = await fetch(SOLANA_RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'castora-wallet-solana-balance',
      method: 'getBalance',
      params: [address],
    }),
  })

  const payload = await response.json()

  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message || 'Unable to load Solana balance')
  }

  return formatTokenAmount(String(payload.result.value / 1_000_000_000), 'SOL')
}

function WalletNetworkCard({
  address,
  balance,
  chainLabel,
  description,
  explorerHref,
  isCreating,
  onCopy,
  onCreate,
  onFund,
  canFund,
}: WalletCardProps) {
  const hasAddress = !!address

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-gray-900 dark:text-gray-100" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{chainLabel}</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
            hasAddress
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
          )}
        >
          {hasAddress ? <CheckCircle2 className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {hasAddress ? 'Ready' : 'Creating'}
        </span>
      </div>

      <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
        <p className="text-xs font-medium uppercase text-gray-400 dark:text-gray-500">Address</p>
        <p className="mt-1 truncate font-mono text-sm text-gray-900 dark:text-gray-100">
          {address ? formatAddress(address) : 'Wallet is being created'}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase text-gray-400 dark:text-gray-500">Native balance</p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{balance || 'Not loaded'}</p>
        </div>
        {!hasAddress && (
          <Button size="sm" variant="outline" onClick={onCreate} disabled={isCreating}>
            {isCreating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create
          </Button>
        )}
      </div>

      {hasAddress && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button size="sm" variant="outline" onClick={onCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          <Button size="sm" variant="outline" onClick={onFund} disabled={!canFund}>
            <CreditCard className="mr-2 h-4 w-4" />
            Fund
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={explorerHref} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Scan
            </a>
          </Button>
        </div>
      )}
    </section>
  )
}

export default function WalletPlaceholder() {
  const { isGuest } = useSupercastUserState()
  const {
    authenticated,
    exportWallet,
    linkWallet,
    ready: privyReady,
    user,
  } = usePrivy()
  const { wallets: ethereumWallets } = useWallets()
  const { createWallet: createEthereumWallet } = useCreateWallet()
  const { fundWallet: fundEthereumWallet } = useFundWallet()
  const { setWalletRecovery } = useSetWalletRecovery()
  const {
    createWallet: createSolanaWallet,
    exportWallet: exportSolanaWallet,
    ready: solanaReady,
    wallets: solanaWallets,
  } = useSolanaWallets()
  const { fundWallet: fundSolanaWallet } = useFundSolanaWallet()
  const router = useRouter()

  const triedEthereumWalletCreation = useRef(false)
  const triedSolanaWalletCreation = useRef(false)

  const [balances, setBalances] = useState<BalanceState>({ loading: false })
  const [isCreatingEthereum, setIsCreatingEthereum] = useState(false)
  const [isCreatingSolana, setIsCreatingSolana] = useState(false)
  const [isFundingEthereum, setIsFundingEthereum] = useState(false)
  const [isFundingSolana, setIsFundingSolana] = useState(false)
  const [walletSetupError, setWalletSetupError] = useState<string | null>(null)

  const embeddedEthereumWallet = useMemo(() => {
    return ethereumWallets.find((wallet) => wallet.walletClientType === 'privy')
  }, [ethereumWallets])

  const linkedEthereumWallet = useMemo(() => {
    return user?.linkedAccounts?.find((account) => (
      account.type === 'wallet' &&
      account.chainType === 'ethereum' &&
      (account.walletClientType === 'privy' || account.walletClient === 'privy')
    ))
  }, [user?.linkedAccounts])

  const ethereumAddress = embeddedEthereumWallet?.address || (linkedEthereumWallet?.type === 'wallet' ? linkedEthereumWallet.address : undefined)
  const solanaWallet = useMemo(() => {
    return solanaWallets.find((wallet) => wallet.walletClientType === 'privy') || solanaWallets[0]
  }, [solanaWallets])
  const linkedSolanaWallet = useMemo(() => {
    return user?.linkedAccounts?.find((account) => (
      account.type === 'wallet' &&
      account.chainType === 'solana' &&
      (account.walletClientType === 'privy' || account.walletClient === 'privy')
    ))
  }, [user?.linkedAccounts])
  const solanaAddress = solanaWallet?.address || (linkedSolanaWallet?.type === 'wallet' ? linkedSolanaWallet.address : undefined)
  const linkedAccountCount = user?.linkedAccounts?.length || 0

  const createEmbeddedEthereumWallet = useCallback(async () => {
    if (ethereumAddress || isCreatingEthereum) return

    setIsCreatingEthereum(true)
    setWalletSetupError(null)

    try {
      await createEthereumWallet()
      toast.success('EVM wallet created')
    } catch (error) {
      console.error('Error creating embedded Ethereum wallet:', error)
      setWalletSetupError('EVM wallet setup is pending. Try again in a moment.')
    } finally {
      setIsCreatingEthereum(false)
    }
  }, [createEthereumWallet, ethereumAddress, isCreatingEthereum])

  const createEmbeddedSolanaWallet = useCallback(async () => {
    if (solanaAddress || isCreatingSolana || !solanaReady) return

    setIsCreatingSolana(true)
    setWalletSetupError(null)

    try {
      await createSolanaWallet()
      toast.success('Solana wallet created')
    } catch (error) {
      console.error('Error creating embedded Solana wallet:', error)
      setWalletSetupError('Solana wallet setup is pending. Try again in a moment.')
    } finally {
      setIsCreatingSolana(false)
    }
  }, [createSolanaWallet, isCreatingSolana, solanaAddress, solanaReady])

  const copyAddress = useCallback(async (address?: string) => {
    if (!address) {
      toast.error('Wallet address is still being created')
      return
    }

    await navigator.clipboard.writeText(address)
    toast.success('Address copied')
  }, [])

  const refreshBalances = useCallback(async () => {
    if (!ethereumAddress && !solanaAddress) return

    setBalances((current) => ({ ...current, loading: true, error: null }))

    const [evmResult, solanaResult] = await Promise.allSettled([
      ethereumAddress ? fetchBaseEthBalance(ethereumAddress) : Promise.resolve(undefined),
      solanaAddress ? fetchSolanaBalance(solanaAddress) : Promise.resolve(undefined),
    ])

    setBalances({
      evm: evmResult.status === 'fulfilled' ? evmResult.value : undefined,
      solana: solanaResult.status === 'fulfilled' ? solanaResult.value : undefined,
      loading: false,
      error: evmResult.status === 'rejected' || solanaResult.status === 'rejected'
        ? 'Some balances could not be refreshed.'
        : null,
      updatedAt: Date.now(),
    })
  }, [ethereumAddress, solanaAddress])

  const fundEthereum = useCallback(async () => {
    if (!ethereumAddress) return

    setIsFundingEthereum(true)

    try {
      await fundEthereumWallet(ethereumAddress)
      await refreshBalances()
    } catch (error) {
      console.error('Error funding EVM wallet:', error)
      toast.error('Funding flow was closed or unavailable')
    } finally {
      setIsFundingEthereum(false)
    }
  }, [ethereumAddress, fundEthereumWallet, refreshBalances])

  const fundSolana = useCallback(async () => {
    if (!solanaAddress) return

    setIsFundingSolana(true)

    try {
      await fundSolanaWallet(solanaAddress)
      await refreshBalances()
    } catch (error) {
      console.error('Error funding Solana wallet:', error)
      toast.error('Funding flow was closed or unavailable')
    } finally {
      setIsFundingSolana(false)
    }
  }, [fundSolanaWallet, refreshBalances, solanaAddress])

  const secureWallet = useCallback(async () => {
    if (!ethereumAddress) {
      toast.error('Create the EVM wallet first')
      return
    }

    try {
      await setWalletRecovery()
      toast.success('Wallet recovery updated')
    } catch (error) {
      console.error('Error setting wallet recovery:', error)
      toast.error('Recovery flow was closed or unavailable')
    }
  }, [ethereumAddress, setWalletRecovery])

  const exportEmbeddedWallet = useCallback(async () => {
    if (!ethereumAddress) {
      toast.error('Create the EVM wallet first')
      return
    }

    try {
      await exportWallet({ address: ethereumAddress })
    } catch (error) {
      console.error('Error exporting EVM wallet:', error)
      toast.error('Export flow was closed or unavailable')
    }
  }, [ethereumAddress, exportWallet])

  const exportEmbeddedSolanaWallet = useCallback(async () => {
    if (!solanaAddress) {
      toast.error('Create the Solana wallet first')
      return
    }

    try {
      await exportSolanaWallet({ address: solanaAddress })
    } catch (error) {
      console.error('Error exporting Solana wallet:', error)
      toast.error('Export flow was closed or unavailable')
    }
  }, [exportSolanaWallet, solanaAddress])

  useEffect(() => {
    if (
      privyReady &&
      authenticated &&
      !ethereumAddress &&
      !triedEthereumWalletCreation.current
    ) {
      triedEthereumWalletCreation.current = true
      createEmbeddedEthereumWallet()
    }
  }, [authenticated, createEmbeddedEthereumWallet, ethereumAddress, privyReady])

  useEffect(() => {
    if (
      privyReady &&
      authenticated &&
      solanaReady &&
      !solanaAddress &&
      !triedSolanaWalletCreation.current
    ) {
      triedSolanaWalletCreation.current = true
      createEmbeddedSolanaWallet()
    }
  }, [authenticated, createEmbeddedSolanaWallet, privyReady, solanaAddress, solanaReady])

  useEffect(() => {
    refreshBalances()
  }, [refreshBalances])

  return (
    <div className="min-h-[calc(100vh-100px)] pt-12 lg:pt-0">
      <FeedHeader title="Wallet" />

      <div className="space-y-5 px-4 py-5 sm:px-6">
        <section className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-5 text-white shadow-sm dark:border-gray-800">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <WalletCards className="h-6 w-6" />
                <h1 className="text-2xl font-semibold">Castora Wallet</h1>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatusPill active={privyReady && authenticated} label="Privy" />
                <StatusPill active={!!ethereumAddress} label="EVM" />
                <StatusPill active={!!solanaAddress} label="Solana" />
                <StatusPill active={linkedAccountCount > 0} label={`${linkedAccountCount} linked`} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="bg-white text-gray-950 hover:bg-gray-100" onClick={refreshBalances} disabled={balances.loading}>
                <RefreshCw className={cn('mr-2 h-4 w-4', balances.loading && 'animate-spin')} />
                Refresh
              </Button>
              {isGuest() && (
                <Button className="bg-white text-gray-950 hover:bg-gray-100" onClick={() => router.push('/onboarding')}>
                  Create profile
                </Button>
              )}
            </div>
          </div>
        </section>

        {walletSetupError && (
          <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{walletSetupError}</span>
          </div>
        )}

        {balances.error && (
          <div className="flex gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{balances.error}</span>
          </div>
        )}

        <div className="grid gap-3">
          <WalletNetworkCard
            address={ethereumAddress}
            balance={balances.loading && !balances.evm ? 'Refreshing...' : balances.evm}
            canFund={!isFundingEthereum}
            chainLabel="Base / EVM"
            description="Privy embedded wallet"
            explorerHref={ethereumAddress ? `https://basescan.org/address/${ethereumAddress}` : undefined}
            isCreating={isCreatingEthereum}
            onCopy={() => copyAddress(ethereumAddress)}
            onCreate={createEmbeddedEthereumWallet}
            onFund={fundEthereum}
          />

          <WalletNetworkCard
            address={solanaAddress}
            balance={balances.loading && !balances.solana ? 'Refreshing...' : balances.solana}
            canFund={!isFundingSolana}
            chainLabel="Solana"
            description="Privy embedded wallet"
            explorerHref={solanaAddress ? `https://solscan.io/account/${solanaAddress}` : undefined}
            isCreating={isCreatingSolana}
            onCopy={() => copyAddress(solanaAddress)}
            onCreate={createEmbeddedSolanaWallet}
            onFund={fundSolana}
          />
        </div>

        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Wallet controls</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button variant="outline" onClick={secureWallet} disabled={!ethereumAddress}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Secure
            </Button>
            <Button variant="outline" onClick={linkWallet}>
              <Link2 className="mr-2 h-4 w-4" />
              Link wallet
            </Button>
            <Button variant="outline" onClick={exportEmbeddedWallet} disabled={!ethereumAddress}>
              <KeyRound className="mr-2 h-4 w-4" />
              Export EVM
            </Button>
            <Button variant="outline" onClick={exportEmbeddedSolanaWallet} disabled={!solanaAddress}>
              <KeyRound className="mr-2 h-4 w-4" />
              Export Sol
            </Button>
          </div>
        </section>

        <Link href="/ecosystem" className="flex justify-center">
          <Button className="w-full sm:w-auto" variant="link">
            Legacy ecosystem integrations
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
        active ? 'bg-white text-gray-950' : 'bg-white/10 text-white/70'
      )}
    >
      {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
      {label}
    </span>
  )
}
