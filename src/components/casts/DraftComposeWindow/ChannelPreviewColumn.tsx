import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";
import { HOST_URL } from "@/utils/hostURL";
import { usePrivy } from "@privy-io/react-auth";
import axios from "axios";
import { UseQueryResult, useQuery } from "react-query";
import { DRAFT_SEND_STATUS, Draft } from "@prisma/client";
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
import CastExplorePreview from "../CastExplorePreview";
import { useCurrentChannel } from "@/providers/CurrentChannelProvider";
import ChannelTrendingCastPreview from "../ChannelTrendingCastPreview";
import Spinner from "@/components/Spinner";

interface ChannelPreviewColumnProps { }

export default function ChannelPreviewColumn(props: ChannelPreviewColumnProps) {

  const { supercastUserState } = useSupercastUserState();
  const { getAccessToken } = usePrivy();
  const { currentChannel } = useCurrentChannel();

  const [channelTrendingCarouselAPI, setChannelTrendingCarouselAPI] = useState<CarouselApi>()
  const [currentCastIndex, setCurrentCastIndex] = useState(0)

  const scrollPrevCast = useCallback(() => {
    if (channelTrendingCarouselAPI) channelTrendingCarouselAPI.scrollPrev()
  }, [channelTrendingCarouselAPI])

  const scrollNextCast = useCallback(() => {
    if (channelTrendingCarouselAPI) channelTrendingCarouselAPI.scrollNext()
  }, [channelTrendingCarouselAPI])

  const fetchChannelPreviewData = async () => {
    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/channels/${currentChannel.id}/preview`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })

    return response.data
  }

  const channelPreviewQuery = useQuery(
    ["channelPreviewColumn", currentChannel?.id],
    fetchChannelPreviewData,
    {
      enabled: !!currentChannel && !!currentChannel.id,
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
    <div className="flex flex-col overflow-auto h-[90vh] px-6">
      <h2 className="text-lg font-semibold tracking-tight mb-2">Channel preview</h2>
      {(!currentChannel || !currentChannel.id) && <div className="flex flex-row justify-start items-center">
        <div className="text-sm text-gray-500 dark:text-gray-300">No channel selected</div>
      </div>}
      {channelPreviewQuery.isLoading && <Spinner />}
      {channelPreviewQuery.isError && <div>Error fetching channel preview</div>}
      {channelPreviewQuery.isSuccess && (
        <div className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-2">
            <ChannelExplorePreview channel={channelPreviewQuery.data.channel} />
          </div>
          <Carousel setApi={setChannelTrendingCarouselAPI}>
            <div className="flex flex-col gap-y-2">
              <div className="flex flex-row items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Trending casts</h2>
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
                    disabled={currentCastIndex === channelPreviewQuery.data.trending_casts.length}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CarouselContent>
                {channelPreviewQuery.data.trending_casts.map((cast: any) => (
                  <CarouselItem key={cast.hash + "channel-preview"}>
                    <ChannelTrendingCastPreview cast={cast} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </div>
          </Carousel>
        </div>
      )}
    </div >
  );
}