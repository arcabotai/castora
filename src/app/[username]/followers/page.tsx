import ProfilePage from "@/components/profile/ProfilePage"
import { HOST_URL } from '@/utils/hostURL'
import { Metadata, ResolvingMetadata } from 'next'
import axios from 'axios'
import { notFound } from 'next/navigation'

export async function generateMetadata(
  { params }: { params: { username: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const username = params.username
  let profile;

  try {
    const response = await axios.get(`${HOST_URL}/api/profile?username=${username}`)
    profile = response.data.user
  } catch (error) {
    // Instead of returning metadata for a not found user, we'll throw a 404
    notFound()
  }

  return {
    title: `${profile.display_name ? profile.display_name : "New user"} (@${profile.username}) on Castora`,
    description: profile.bio,
    openGraph: {
      images: [
        {
          url: profile.pfp_url,
        }
      ],
      title: `${profile.display_name ? profile.display_name : "New user"} (@${profile.username}) on Castora`,
      description: profile.profile.bio.text,
    },
  }
}

export default async function Home({ params }: { params: { username: string } }) {
  return <ProfilePage params={params} defaultRightColumnStatus="followers" />
}
