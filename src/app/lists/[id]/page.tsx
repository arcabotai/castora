'use client'
import Layout from "@/components/Layout"
import ListsDashboard from "@/components/lists/ListsDashboard"
import ListDetail from "@/components/lists/ListDetail"
import { useParams } from "next/navigation"
import { useEffect } from "react"
import { useSelectedList } from "@/providers/SelectedListProvider"

export default function Home() {

  const { id } = useParams()
  const { setEditedList } = useSelectedList()
  useEffect(() => {
    if (id) {
      setEditedList({
        name: '',
        id: id as string,
      })
    }
  }, [id])

  return (
    <Layout
      currentTab="Lists"
      main={<ListsDashboard />}
      rightColumn={<ListDetail isColumn={true} />}
    />
  )
}
