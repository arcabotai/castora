import Layout from "@/components/Layout"
import WalletPlaceholder from "@/components/wallet/WalletPlaceholder"

export default function Home() {
  return (
    <Layout
      currentTab="Wallet"
      main={<WalletPlaceholder />}
      rightColumn={<></>}
    />
  )
}
