import CastDetailColumn from "@/components/CastDetailColumn"
import Feed from "@/components/Feed"
import Layout from "@/components/Layout"

export default function Home() {
  return (
    <Layout
      currentTab="Home"
      main={<Feed />}
      rightColumn={<CastDetailColumn />}
    />
  )
}
