import Layout from "@/components/Layout";
import MapComponent from "@/components/map/Map";

export default function Home() {
  return (
    <Layout
      currentTab="Scheduled"
      main={<MapComponent />}
      rightColumn={<div></div>}
    />
  )
}