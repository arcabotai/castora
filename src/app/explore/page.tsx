import CastDetailColumn from "@/components/CastDetailColumn"
import Layout from "@/components/Layout"
import Search from "@/components/search/Search"

export default function Home() {
  return (
    <Layout
      currentTab="Explore"
      main={<Search />}
      rightColumn={<CastDetailColumn />}
    />
  )
}
