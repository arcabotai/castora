
import Layout from "@/components/Layout"
import BookmarksFeed from "@/components/BookmarksFeed"
import CastDetailColumn from "@/components/CastDetailColumn"

export default function Home() {
  return (
    <Layout
      currentTab="Bookmarks"
      main={<BookmarksFeed />}
      rightColumn={<CastDetailColumn />}
    />
  )
}
