'use client'

import Layout from '@/components/Layout'
import ChannelFeed from '@/components/ChannelFeed'
import ChannelFeedColumn from '@/components/channels/ChannelFeedColumn'

export default function ChannelFeedPage({ params }: { params: { slug: string } }) {

  return (
    <Layout
      currentTab="Channel"
      main={<ChannelFeed channel_id={params.slug} />}
      rightColumn={<ChannelFeedColumn />}
    />
  )
}
