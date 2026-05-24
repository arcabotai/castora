'use client'

import { SwapModal } from "@decent.xyz/the-box";
import { getNativeTokenInfo } from "@decent.xyz/box-common";
import { useModal } from "connectkit";
import { config as wagmiConfig } from '@/providers/Web3Provider'; // Adjust this import path as needed
import { ChainId } from "@decent.xyz/box-common";

const degenToken = {
  address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
  chainId: ChainId.BASE,
  decimals: 18,
  symbol: 'DEGEN',
  name: 'Degen',
  isNative: false,
  logo: '/tokenLogos/degenLogo.webp',
}

const usdcToken = {
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  chainId: ChainId.BASE,
  decimals: 6,
  symbol: 'USDC',
  name: 'USD Coin',
  isNative: false,
  logo: '/tokenLogos/usdcLogo.webp',
}

const moxieToken = {
  address: '0x8c9037d1ef5c6d1f6816278c7aaf5491d24cd527',
  chainId: ChainId.BASE,
  decimals: 18,
  symbol: 'MOXIE',
  name: 'Moxie',
  isNative: false,
  logo: '/tokenLogos/moxieLogo.webp',
}

const wethToken = {
  address: '0x4200000000000000000000000000000000000006',
  chainId: ChainId.BASE,
  decimals: 18,
  symbol: 'WETH',
  name: 'Wrapped Ethereum',
  isNative: false,
  logo: '/tokenLogos/wethLogo.webp',
}

const higherToken = {
  address: '0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe',
  chainId: ChainId.BASE,
  decimals: 18,
  symbol: 'HIGHER',
  name: 'Higher',
  isNative: false,
  logo: '/tokenLogos/higherLogo.webp',
}

const degenChainWrappedDegen = {
  address: '0xEb54dACB4C2ccb64F8074eceEa33b5eBb38E5387',
  chainId: ChainId.DEGEN,
  decimals: 18,
  symbol: 'WDEGEN',
  name: 'Wrapped Degen',
  isNative: false,
  logo: '/tokenLogos/degenLogo.webp',
}

const degenChainNativeDegen = getNativeTokenInfo(ChainId.DEGEN)

const ethToken = getNativeTokenInfo(ChainId.BASE)

const popularTokens = [moxieToken, higherToken, degenChainWrappedDegen, degenChainNativeDegen]


export const SwapBox = () => {
  const { setOpen: openConnectModal } = useModal();

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight mb-2">Swap</h2>
      <SwapModal
        className="focus:outline-none dark:border-gray-700 rounded-xl border"
        wagmiConfig={wagmiConfig}
        onConnectWallet={() => openConnectModal(true)}
        apiKey={process.env.NEXT_PUBLIC_DECENT_API_KEY}
        chainIds={[ChainId.BASE, ChainId.DEGEN, ChainId.HAM]}
        popularTokens={popularTokens}
        selectedSrcToken={{
          chainId: ChainId.BASE,
          tokenInfo: usdcToken
        }}
        selectedDstToken={{
          chainId: ChainId.BASE,
          tokenInfo: moxieToken
        }}
      />
    </div>
  );
};