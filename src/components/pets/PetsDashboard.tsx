'use client'

import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import FeedHeader from '../FeedHeader'
import PetCreation from './PetCreation'
import ManagePet from './ManagePet'
import { useQuery } from 'react-query'
import axios from 'axios'
import { HOST_URL } from '@/utils/hostURL'
import { Skeleton } from '../ui/skeleton'
import { Loader2 } from 'lucide-react'
import { SUPERANON_ADMIN_FIDS } from '@/utils/anon/admin'
import { notFound } from 'next/navigation'


export default function PetsDashboard() {
  const { supercastUserState } = useSupercastUserState()
  const { ready, authenticated, getAccessToken } = usePrivy()

  const isSuperanonNonAdmin = supercastUserState.currentFid === Number(process.env.NEXT_PUBLIC_SUPERANON_FID) && !SUPERANON_ADMIN_FIDS.includes(supercastUserState.userFid)

  if (isSuperanonNonAdmin) {
    return notFound()
  }

  const fetchMyPets = async () => {
    const accessToken = await getAccessToken()
    const response = await axios.get(`${HOST_URL}/api/pets/my-pet`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
    return response.data
  }

  const myPetQuery = useQuery(
    ['myPet', supercastUserState.currentFid],
    fetchMyPets, {
    enabled: !!supercastUserState.currentFid && ready && authenticated,
  })

  return (
    <div>
      {myPetQuery.isSuccess && (
        myPetQuery.data.pet ?
          <ManagePet
            pet={myPetQuery.data.pet}
          />
          :
          <PetCreation
            petOptions={myPetQuery.data.petOptions}
          />
      )}
      {myPetQuery.isLoading &&
        <div className="flex flex-row justify-center items-center w-full pt-24">
          <Loader2 className="animate-spin" />
        </div>
      }
    </div>
  )
}
