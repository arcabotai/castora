
import Layout from "@/components/Layout"
import NotificationsFeed from "@/components/NotificationsFeed"
import CastDetailColumn from "@/components/CastDetailColumn"

export default function Home() {
  return (
    <Layout
      currentTab="Notifications"
      main={<NotificationsFeed />}
      rightColumn={<CastDetailColumn />}
    />
  )
}
