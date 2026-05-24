import React from 'react';
import { ConnectKitButton } from "connectkit";
import { Button } from '../ui/button';
import { useDisconnect } from 'wagmi'

const EcosystemConnectWalletButton: React.FC = () => {
  const { disconnect } = useDisconnect()

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, hide, address, ensName, chain }) => {
        return (
          <Button
            variant={isConnected ? 'secondary' : 'default'}
            size="xs"
            onClick={() => {
              if (isConnected) {
                disconnect()
              } else {
                show()
              }
            }}
          >
            {isConnected ? `Disconnect ${ensName ? ensName : `${address.slice(0, 3)}...${address.slice(-3)}`
              }` : 'Connect wallet'}
          </Button>
        )
      }}
    </ConnectKitButton.Custom>
  );
};

export default EcosystemConnectWalletButton;