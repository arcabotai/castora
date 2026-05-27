'use client';

import { PrivyProvider } from '@privy-io/react-auth';

const CASTORA_PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmpke74en00660cjvnb9aq32k';

export default function PrivyProviderProxy({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={CASTORA_PRIVY_APP_ID}
      config={{
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        appearance: {
          landingHeader: 'Use an email to sign up or log in',
        }
      }}
    >
      {children}
    </PrivyProvider>
  );
}
