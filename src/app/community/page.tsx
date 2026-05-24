import CommunityDashboard from "@/components/community/CommunityDashboard"
import Layout from "@/components/Layout"

export default function Community() {
  return (
    <Layout
      currentTab="Community"
      main={<CommunityDashboard />}
      rightColumn={<></>}
    />
  )
}
