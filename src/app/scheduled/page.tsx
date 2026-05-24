
import Layout from "@/components/Layout"
import ScheduledFeed from "@/components/ScheduledFeed"
import CastDetailColumn from "@/components/CastDetailColumn"

export default function Home() {
  return (
    <Layout
      currentTab="Scheduled"
      main={<ScheduledFeed />}
      rightColumn={<div></div>}
    />
  )
}
