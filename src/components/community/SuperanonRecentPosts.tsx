import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";
import { HOST_URL } from "@/utils/hostURL";
import { usePrivy } from "@privy-io/react-auth";
import axios from "axios";
import { UseQueryResult, useQuery } from "react-query";
import { DRAFT_SEND_STATUS, Draft, PRODUCT_TYPE } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid"

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ChannelExplorePreview from "@/components/ChannelExplorePreview";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";
import ChannelTrendingCastPreview from "../casts/ChannelTrendingCastPreview";
import { Skeleton } from "../ui/skeleton";
import { useCheckoutDialog } from "@/hooks/useCheckoutDialog";
import Link from "next/link";

const PostPreviewSkeleton = () => {
  return <div className="w-full flex flex-col gap-y-2 py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-xl h-[205px] sm:h-[190px]">
    <div className="flex flex-row gap-x-2">
      <Skeleton className="h-4 w-4 rounded-full" />
      <Skeleton className="h-4 w-32" />
    </div>
    <div className="flex flex-col gap-y-2 h-full justify-between">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  </div>
}

export default function SuperChannelTrendingPosts() {

  const { supercastUserState, isRegularUser, isSuperMember } = useSupercastUserState();
  const { getAccessToken } = usePrivy();
  const { openCheckout } = useCheckoutDialog()

  const [channelTrendingCarouselAPI, setChannelTrendingCarouselAPI] = useState<CarouselApi>()
  const [currentCastIndex, setCurrentCastIndex] = useState(0)

  const scrollPrevCast = useCallback(() => {
    if (channelTrendingCarouselAPI) channelTrendingCarouselAPI.scrollPrev()
  }, [channelTrendingCarouselAPI])

  const scrollNextCast = useCallback(() => {
    if (channelTrendingCarouselAPI) channelTrendingCarouselAPI.scrollNext()
  }, [channelTrendingCarouselAPI])

  const fetchSuperanonRecentPosts = async () => {
    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/user/casts?profileFid=${862100}&ownerFid=${supercastUserState.currentFid}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })

    return response.data
  }

  const channelPreviewQuery = useQuery(
    ["superanonRecentPosts"],
    fetchSuperanonRecentPosts,
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  )

  useEffect(() => {
    if (!channelTrendingCarouselAPI) return
    setCurrentCastIndex(channelTrendingCarouselAPI.selectedScrollSnap() + 1)

    channelTrendingCarouselAPI.on("select", () => {
      setCurrentCastIndex(channelTrendingCarouselAPI.selectedScrollSnap() + 1)
    })
  }, [channelTrendingCarouselAPI])


  return (
    <div className="px-4 sm:px-6 lg:px-8 h-[313px] sm:h-[298px]">
      {channelPreviewQuery.isError && <div>Error fetching channel preview</div>}
      <Carousel setApi={setChannelTrendingCarouselAPI}>
        <div className="flex flex-col gap-y-2">
          <div className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-medium tracking-tight">Recent on <Link href="/superanon" className="font-semibold">@superanon</Link></h2>
            <div className="flex flex-row items-center gap-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-full"
                onMouseDown={() => scrollPrevCast()}
                disabled={currentCastIndex === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-full"
                onMouseDown={() => scrollNextCast()}
                disabled={currentCastIndex === channelPreviewQuery.data?.casts?.length}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Recent posts on our shared community account
          </p>
          <CarouselContent>
            {channelPreviewQuery.isLoading && <CarouselItem key={"skeleton"} className="h-[205px] sm:h-[190px]"><PostPreviewSkeleton /></CarouselItem>}
            {channelPreviewQuery.data?.casts?.map((cast: any) => (
              <CarouselItem key={cast.hash + "channel-preview"} className="h-[205px] sm:h-[190px]">
                <ChannelTrendingCastPreview cast={cast} />
              </CarouselItem>
            ))}
          </CarouselContent>
          {(isRegularUser() && !isSuperMember()) ?
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => {
                openCheckout(PRODUCT_TYPE.MEMBERSHIP)
              }}
            >
              Become a member to post from @superanon
            </Button>
            :
            <Link href="/superanon">
              <Button
                className="w-full"
              >
                View @superanon profile
              </Button>
            </Link>
          }
        </div>
      </Carousel>
    </div >
  );
}