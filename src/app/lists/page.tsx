
import Layout from "@/components/Layout"
import ListsDashboard from "@/components/lists/ListsDashboard"
import ListDetail from "@/components/lists/ListDetail"

export default function Home() {
  return (
    <Layout
      currentTab="Lists"
      main={<ListsDashboard />}
      rightColumn={<ListDetail isColumn={true} />}
    />
  )
}
