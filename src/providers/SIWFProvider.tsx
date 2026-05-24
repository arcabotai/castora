'use client'

import { AuthKitProvider } from '@farcaster/auth-kit';
import { FC, PropsWithChildren } from 'react'

const config = {
  rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC_ENDPOINT,
  domain: 'super.sc',
  siweUri: 'https://super.sc',
};

export const SIWFProvider: FC<PropsWithChildren<{}>> = ({ children }) => (
  <AuthKitProvider config={config}>
    {children}
  </AuthKitProvider>
)
