import Layout from '@/components/Layout'
import CastDetailMainFeed from '@/components/CastDetailMainFeed'
import CastDetailColumn from '@/components/CastDetailColumn'
import { HOST_URL } from '@/utils/hostURL'

import { Metadata, ResolvingMetadata } from 'next'
import axios from 'axios'

export const revalidate = 300

export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const slug = params.slug

  const cast = await axios.get(`${HOST_URL}/api/cast/single?hash=${slug}`)

  return {
    title: `${cast.data.currentCast.author.display_name} on Castora`,
    description: cast.data.currentCast.text,
    openGraph: {
      images: [
        {
          url: `/api/og?type=cast&displayName=${cast.data.currentCast.author.display_name}&username=${cast.data.currentCast.author.username}&timestamp=${cast.data.currentCast.timestamp}&avatar=${cast.data.currentCast.author.pfp_url}&reactionCount=${cast.data.currentCast.reactions.likes_count}&recastCount=${cast.data.currentCast.reactions.recasts_count}&replyCount=${cast.data.currentCast.replies.count}&text=${encodeURIComponent(cast.data.currentCast.text.replace(/\n/g, '\\n'))}`,
          width: 1200,
          height: 630,
        }
      ],
      title: `${cast.data.currentCast.author.display_name} on Castora`,
      description: cast.data.currentCast.text,
    },
  }
}

export default function CastDetailPage({ params }: { params: { slug: string } }) {

  return (
    <Layout
      currentTab='Cast'
      main={
        <CastDetailMainFeed castHash={params.slug} />
      }
      rightColumn={<CastDetailColumn />}
    />
  )
}
