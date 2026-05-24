
import Layout from "@/components/Layout"
import ScheduledFeed from "@/components/ScheduledFeed"
import CastDetailColumn from "@/components/CastDetailColumn"
import DraftsColumn from "@/components/casts/DraftComposeWindow/DraftsColumn"
import DraftsFeed from "@/components/drafts/DraftsFeed"

export default function Home() {
  return (
    <Layout
      currentTab="Drafts"
      main={<DraftsFeed />}
      rightColumn={<div></div>}
    />
  )
}
