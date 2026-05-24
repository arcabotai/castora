'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart, Loader2, Utensils } from "lucide-react"
import CastInFeed from '../CastInFeed'
import CastInFeedSkeleton from '../casts/CastInFeedSkeleton'
import { Pet } from '@prisma/client'
import { FEED_POINTS, PLAY_POINTS } from '@/utils/petConfig'
import axios from 'axios'
import { HOST_URL } from '@/utils/hostURL'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import { toast } from 'sonner'
import { useInfiniteQuery, useQueryClient } from 'react-query'
import { useInView } from 'react-intersection-observer'
import { Badge } from '../ui/badge'
import { formatNumber } from '@/utils/textUtils'

type ManagePetProps = {
}

export default function ManagePet({ pet }) {
  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()
  const { ref: inViewRef, inView } = useInView()
  const queryClient = useQueryClient()

  const [happiness, setHappiness] = useState(pet.happiness)
  const [loadingFeeding, setLoadingFeeding] = useState(false)
  const [loadingPlaying, setLoadingPlaying] = useState(false)

  const increasedHappiness = (amount: number) => {
    setHappiness((prevHappiness) => prevHappiness + amount)
  }

  const feed = async () => {
    setLoadingFeeding(true)

    const accessToken = await getAccessToken()

    axios.put(`${HOST_URL}/api/pets/my-pet/feed`, {}, {
      headers: {
        'asFid': supercastUserState.currentFid,
        'Authorization': `Bearer ${accessToken}`,
      }
    }).then(() => {
      increasedHappiness(FEED_POINTS)
    }).catch((error) => {
      console.error(error)
      toast.error('Failed to feed pet')
    }).finally(() => {
      setLoadingFeeding(false)
    })
  }

  const play = async () => {
    setLoadingPlaying(true)

    const accessToken = await getAccessToken()

    axios.put(`${HOST_URL}/api/pets/my-pet/play`, {}, {
      headers: {
        'asFid': supercastUserState.currentFid,
        'Authorization': `Bearer ${accessToken}`,
      }
    }).then(() => {
      increasedHappiness(PLAY_POINTS)
    }).catch((error) => {
      console.error(error)
      toast.error('Failed to play with pet')
    }).finally(() => {
      setLoadingPlaying(false)
    })
  }

  const handleDeletePet = async () => {
    const accessToken = await getAccessToken()

    axios.delete(`${HOST_URL}/api/pets`, {
      headers: {
        'asFid': supercastUserState.currentFid,
        'Authorization': `Bearer ${accessToken}`,
      }
    }).then(() => {
      queryClient.invalidateQueries(['myPet'])
    }).catch((error) => {
      console.error(error)
      toast.error('Failed to delete pet')
    })
  }

  const fetchCasts = async ({ pageParam = '' }) => {

    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/user/casts?cursor=${pageParam}&profileFid=${pet.fid}&ownerFid=${supercastUserState.currentFid}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    });

    return response.data;
  };

  const castsQuery = useInfiniteQuery(
    ['ProfileCasts', pet?.fid, supercastUserState],
    fetchCasts,
    {
      getNextPageParam: (lastPage) => lastPage.cursor || undefined,
      enabled: (!!pet && !!pet.fid)
    }
  );

  useEffect(() => {
    if (inView && castsQuery.hasNextPage && !castsQuery.isFetchingNextPage) {
      castsQuery.fetchNextPage()
    }
  }, [inView, castsQuery.hasNextPage, castsQuery.isFetchingNextPage])

  if (!pet) {
    return null
  }

  return (
    <main className="py-4 flex flex-col gap-y-4">
      <div className="flex items-center space-x-4 justify-between lg:justify-start">
        <img className="w-40 h-40 lg:w-32 lg:h-32 ring-2 ring-slate-300 border-background rounded-full overflow-hidden shrink-0" src={pet.pfp_url} alt={`${pet.display_name} the ${pet.species}`} />
        <div className="flex flex-col gap-4 w-1/2">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold tracking-tight">Traits</h3>
            <div className="flex flex-row flex-wrap justify-start gap-1">
              {pet.petOption.traits.map((trait) => (
                <Badge key={trait} variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors dark:border-slate-200">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-col flex-wrap gap-1">
            <h3 className="text-sm font-medium text-muted-foreground">Interests</h3>
            <div className="flex flex-row flex-wrap gap-1">
              {pet.petOption.interests.map((interest) => (
                <Badge key={interest} variant="outline" className="text-secondary-foreground border-secondary-foreground/20 hover:bg-secondary/10 transition-colors line-clamp-1 dark:border-slate-200">
                  <Heart className="w-3 h-3 mr-1 inline" />
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* TODO: Add happiness */}
      {/* <div className="space-y-2 mb-8">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Happiness</span>
          <span className="text-sm font-medium">{happiness}%</span>
        </div>
        <Progress value={happiness} className="w-full" />
      </div>

      <div className="mt-auto flex flex-col lg:flex-row gap-4 mb-8">
        <Button onClick={feed} className="w-full py-3">
          {loadingFeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Utensils className="mr-2 h-4 w-4" />}
          Feed
        </Button>
        <Button onClick={play} className="w-full py-3">
          {loadingPlaying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className="mr-2 h-4 w-4" />}
          Play
        </Button>
      </div> */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-center gap-1">
          <h3 className="text-2xl font-semibold">{pet.display_name}</h3>
          <p className="text-sm text-muted-foreground text-gray-500">@{pet.username}</p>
        </div>
        <div className="flex flex-row gap-x-4">
          <p><span className="font-semibold text-black dark:text-gray-100">{formatNumber(pet.follower_count)}</span> Followers</p>
          <p><span className="font-semibold text-black dark:text-gray-100">{formatNumber(pet.following_count)}</span> Following</p>
        </div>
        <p className="text-sm text-muted-foreground">{pet.petOption.description}</p>
      </div>

      <h3 className='text-lg font-semibold'>{pet.display_name}'s latest posts:</h3>
      {castsQuery.status === 'loading' ? (
        renderSkeletons()
      ) : castsQuery.status === 'error' ? (
        <p>Error loading posts</p>
      ) : (
        <ul role="list" className="">
          {castsQuery.data.pages.map((page, i) => (
            <React.Fragment key={i}>
              {page.casts.map((cast, castIndex) => (
                <li
                  className="sm:hover:bg-gray-50 hover:cursor-pointer border-b dark:border-gray-800 sm:dark:hover:bg-gray-800"
                  key={cast.hash}
                >
                  <CastInFeed cast={cast} />
                </li>
              ))}
            </React.Fragment>
          ))}
          <li ref={inViewRef}></li>
        </ul>
      )}
      {castsQuery.isFetchingNextPage && renderSkeletons()}
    </main>
  )
}

// Helper function to render skeletons
function renderSkeletons() {
  return (
    <ul>
      {[...Array(5)].map((_, index) => (
        <li key={index} className='px-4 sm:px-6 lg:px-8 border-b dark:border-gray-800'>
          <CastInFeedSkeleton />
        </li>
      ))}
    </ul>
  );
}
