'use client'

import { useEffect, useState } from 'react'

import Layout from '../Layout'
import Profile from '@/components/Profile'
import ProfileRightColumn from '@/components/profile/ProfileRightColumn'
import { User } from '@/types'
import axios from 'axios'
import { HOST_URL } from '@/utils/hostURL'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import { useQuery } from 'react-query'
import { notFound } from 'next/navigation'

interface ProfilePageProps {
  params: { username: string };
  defaultRightColumnStatus?: 'cast' | 'followers' | 'following';
}

export default function ProfilePage({ params, defaultRightColumnStatus = 'cast' }: ProfilePageProps) {

  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken, ready: privyReady } = usePrivy()

  const [rightColumnStatus, setRightColumnStatus] = useState<
    'lists' |
    'cast' |
    'followers' |
    'following' |
    'relevant_follows' |
    ''
  >(defaultRightColumnStatus)

  const fetchProfile = async () => {
    const accessToken = await getAccessToken()

    const response = await axios.get(
      `${HOST_URL}/api/profile?username=${params.username}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          asFid: supercastUserState.currentFid
        }
      }
    )

    if (response.status !== 200) {
      notFound()
    }

    return response.data
  }

  const profileQuery = useQuery(
    ['profilePage', params.username],
    fetchProfile,
    {
      enabled: privyReady,
      refetchOnWindowFocus: false
    }
  )

  return (
    <Layout
      currentTab='Profile'
      main={
        <Profile
          profile={profileQuery.isSuccess ? profileQuery.data.user : null}
          setRightColumnStatus={setRightColumnStatus}
        />
      }
      rightColumn={<ProfileRightColumn
        profile={profileQuery.isSuccess ? profileQuery.data.user : null}
        rightColumnStatus={rightColumnStatus}
        setRightColumnStatus={setRightColumnStatus}
      />}
    />
  )
}