import Layout from "@/components/Layout"
import LegacyEcosystem from "@/components/wallet/LegacyEcosystem"

export default function Home() {
  return (
    <Layout
      currentTab="Wallet"
      main={<LegacyEcosystem />}
      rightColumn={<></>}
    />
  )
}
