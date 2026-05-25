import Layout from '@/components/Layout'
import CastDetailMainFeed from '@/components/CastDetailMainFeed'
import CastDetailColumn from '@/components/CastDetailColumn'
import { HOST_URL } from '@/utils/hostURL'

import { Metadata, ResolvingMetadata } from 'next'
import axios from 'axios'
import DraftPreview from '@/components/drafts/DraftPreview'
import DraftPreviewColumn from '@/components/drafts/DraftPreviewColumn'

export async function generateMetadata(
  { params }: { params: { id: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  return {
    title: `Unpublished draft shared on Castora`,
    description: "Like, recast, and comment on drafts before they are published.",
    openGraph: {
      images: [
        {
          url: `/api/og`,
          width: 1200,
          height: 630,
        }
      ],
      title: `Unpublished draft shared on Castora`,
      description: "Like, recast, and comment on drafts before they are published.",
    },
  }
}

export default function DraftPage({ params }: { params: { id: string } }) {

  return (
    <Layout
      currentTab='DraftDetail'
      main={
        <DraftPreview draftId={params.id} />
      }
      rightColumn={<DraftPreviewColumn />}
    />
  )
}