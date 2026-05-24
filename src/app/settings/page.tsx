import Layout from "@/components/Layout"
import SettingsDashboard from "@/components/SettingsDashboard"

export default function Home() {
  return (
    <Layout
      currentTab="Settings"
      main={<SettingsDashboard />}
      rightColumn={<></>}
    />
  )
}
