"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";
import { usePrivy } from "@privy-io/react-auth";
import axios from "axios";
import { HOST_URL } from "@/utils/hostURL";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "react-query";
import { Dog, Loader2, ChevronLeft, ChevronRight, CheckCircle, Check } from "lucide-react";
import PetOptionCard from "./PetOptionCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "../ui/carousel";
import { PetOption, WAITLIST_STATUS, WAITLIST_TYPE } from "@prisma/client";
import Recast from "../casts/Recast";
import { useDraftComposeWindow } from "@/providers/DraftComposeWindowProvider";
import { useDraftId } from "@/providers/DraftIdProvider";

export default function PetCreation({ petOptions }: { petOptions: PetOption[] }) {

  const { supercastUserState } = useSupercastUserState();
  const { ready, authenticated, getAccessToken } = usePrivy();
  const { setOpenDraftComposeWindow, setInitialText, setInitialEmbeds, setInitialRecastId } = useDraftComposeWindow()
  const { draftId, setDraftId } = useDraftId()
  const queryClient = useQueryClient();

  const [loadingCreate, setLoadingCreate] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [introCarouselApi, setIntroCarouselApi] = useState<CarouselApi>();
  const [introIndex, setIntroIndex] = useState(0);

  const [waitlistLoading, setWaitlistLoading] = useState(false);

  const fetchWaitlistStatus = async () => {
    const accessToken = await getAccessToken();
    const res = await axios.get(`${HOST_URL}/api/waitlist?type=${WAITLIST_TYPE.PETS}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        asFid: supercastUserState.currentFid,
      },
    })
    return res.data
  }

  const waitlistStatusQuery = useQuery({
    queryKey: ["waitlistStatus", supercastUserState.currentFid],
    queryFn: fetchWaitlistStatus,
    enabled: !!supercastUserState.currentFid && ready && authenticated,
  })

  const handleJoinWaitlist = async () => {
    setWaitlistLoading(true);
    const accessToken = await getAccessToken();
    await axios.post(`${HOST_URL}/api/waitlist`, {
      type: WAITLIST_TYPE.PETS,
    },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          asFid: supercastUserState.currentFid,
        },
      },
    )
      .then(() => {
        queryClient.invalidateQueries(["waitlistStatus", supercastUserState.currentFid]);
      })
      .catch((err) => {
        console.log(err);
        toast.error("Failed to join waitlist");
      })
      .finally(() => {
        setWaitlistLoading(false);
      });
  }

  const handleGeneratePets = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCreate(true);

    const accessToken = await getAccessToken();

    axios
      .post(
        `${HOST_URL}/api/pets/options`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            asFid: supercastUserState.currentFid,
          },
        },
      )
      .then((res) => {
        queryClient.invalidateQueries(["myPet", supercastUserState.currentFid]);
      })
      .catch((err) => {
        console.log(err);
        toast.error("Failed to create pet");
      })
      .finally(() => {
        setLoadingCreate(false);
      });
  };

  const handleResetChoices = async () => {
    const accessToken = await getAccessToken();
    axios.delete(`${HOST_URL}/api/pets/options/reset`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        asFid: supercastUserState.currentFid,
      },
    }).then(() => {
      queryClient.invalidateQueries("petOptions");
    })
  };

  const scrollPrev = useCallback(() => {
    if (carouselApi) carouselApi.scrollPrev();
  }, [carouselApi]);

  const scrollNext = useCallback(() => {
    if (carouselApi) carouselApi.scrollNext();
  }, [carouselApi]);

  const scrollIntoPrev = useCallback(() => {
    if (introCarouselApi) introCarouselApi.scrollPrev();
  }, [introCarouselApi]);

  const scrollIntroNext = useCallback(() => {
    if (introCarouselApi) introCarouselApi.scrollNext();
  }, [introCarouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    setCurrentPetIndex(carouselApi.selectedScrollSnap());

    carouselApi.on("select", () => {
      setCurrentPetIndex(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  useEffect(() => {
    if (!introCarouselApi) return;
    setIntroIndex(introCarouselApi.selectedScrollSnap());

    introCarouselApi.on("select", () => {
      setIntroIndex(introCarouselApi.selectedScrollSnap());
    });
  }, [introCarouselApi]);

  return (
    <div className="flex justify-center px-4 sm:px-6 lg:px-8 pt-8">
      {petOptions.length === 0 && (
        <div className="w-full">
          <Carousel setApi={setIntroCarouselApi} className="mb-2">
            <CarouselContent>
              <CarouselItem>
                <div className="w-full h-[400px] flex flex-col gap-y-4 items-center justify-between border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <h3 className="text-3xl font-semibold tracking-tight mb-4 text-center">
                    What are pets?
                  </h3>
                  <ul className="flex flex-col gap-y-2">
                    <li className="text-lg font-medium flex items-center justify-center">
                      Your pet is your farcaster friend.
                    </li>
                    <li className="text-lg font-medium flex items-center justify-center">
                      They have their own profile
                    </li>
                    <li className="text-lg font-medium flex items-center justify-center">
                      They interact with your content
                    </li>
                  </ul>
                  <div className="flex justify-center gap-x-4 items-center">
                    {/* <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                      They can even roast your ideas
                    </p>
                    <Recast hash="0x6a46bab820c205879c65afec2e61fb2056a80076" /> */}
                    <img
                      src="https://gateway.pinata.cloud/ipfs/Qmb1pwEkNRA5sqgFawCf49GeEn1ySALdBXvp82Ycyiu7aU"
                      className="w-1/4 h-auto rounded-full object-cover shrink-0"
                    />
                    <img
                      src="https://gateway.pinata.cloud/ipfs/QmYeqUwen3HnY9JxwpzUPNir8Z7qL5xs2oTB1iPhB8BVBo"
                      className="w-1/4 h-auto rounded-full object-cover shrink-0"
                    />
                    <img
                      src="https://gateway.pinata.cloud/ipfs/QmdSsUUcvsGk3JV6V263Yt2G4NwdkTMJMqvTwkwfRvxt7G"
                      className="w-1/4 h-auto rounded-full object-cover shrink-0"
                    />
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="w-full h-[400px] flex flex-col gap-y-4 items-center justify-between border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <h3 className="text-3xl font-semibold tracking-tight mb-4 text-center">
                    Your pet is your biggest fan
                  </h3>
                  <ul className="flex flex-col gap-y-2">
                    <li className="text-lg font-medium flex items-center justify-center">
                      Reacts and replies to your casts
                    </li>
                    <li className="text-lg font-medium flex items-center justify-center">
                      Is always there to cheer you up
                    </li>
                    <li className="text-lg font-medium flex items-center justify-center">
                      Knows about your interests
                    </li>
                  </ul>
                  <div className="flex flex-col items-center justify-center gap-y-1 w-full">
                    <Recast hash="0x1c7adb1adc380a48cedc0377bf60e23a566dc813" />
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="w-full h-[400px] flex flex-col gap-y-4 items-center justify-between border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <h3 className="text-3xl font-semibold tracking-tight mb-4 text-center">
                    Your pet is an influencer
                  </h3>
                  <ul className="flex flex-col gap-y-2">
                    <li className="text-lg font-medium flex items-center justify-center">
                      Posts multiple times a day
                    </li>
                    <li className="text-lg font-medium flex items-center justify-center">
                      Builds their own audience
                    </li>
                    <li className="text-lg font-medium flex items-center justify-center">
                      Writes like you would
                    </li>
                  </ul>
                  <div className="flex flex-col items-center justify-center gap-y-1 w-full">
                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                      They can even roast your ideas
                    </p>
                    <Recast hash="0x6a46bab820c205879c65afec2e61fb2056a80076" />
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
          <div className="flex justify-center mb-8 gap-4">
            <Button
              size="lg"
              variant="outline"
              onClick={scrollIntoPrev}
              disabled={introIndex === 0}
              className="w-full disabled:hidden"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={scrollIntroNext}
              disabled={introIndex === 2}
              className="w-full disabled:hidden"
            >
              More
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          {waitlistStatusQuery.isSuccess && (
            waitlistStatusQuery.data.in_waitlist ? (
              waitlistStatusQuery.data.status === WAITLIST_STATUS.APPROVED ? (
                <form onSubmit={handleGeneratePets} className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    Congrats! You have been approved.
                  </p>
                  <Button className="w-full" onClick={handleGeneratePets}>
                    {loadingCreate ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Dog className="w-4 h-4 mr-2" />
                    )}
                    Select your pet
                  </Button>
                </form>
              ) : (
                <div className="flex flex-col gap-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    You are on the waitlist.
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    Get ahead of others by posting about Pets.
                  </p>
                  <Button
                    className="w-full h-12 text-lg font-semibold"
                    onClick={() => {
                      const initialText = `ok I need an AI PET. I cant take this anymore. every day I am checking super ai pets waitlist and still no ai pet. every day, check waitlist, no ai pet. I cant take this anymore, I have over invested, by a lot. I pay $10 a month for this shit. it is what it is. but I need an AI PET NOW. can @woj.eth DO SOMETHING`
                      setDraftId(null)
                      setOpenDraftComposeWindow(true)
                      setInitialText(initialText)
                      setInitialEmbeds([])
                      setInitialRecastId(null)
                    }}
                  >
                    Cast to get your pet faster
                  </Button>
                </div>
              )
            ) : (
              <Button
                className="w-full h-12 text-lg font-semibold"
                onClick={handleJoinWaitlist}
                disabled={waitlistLoading}
              >
                {waitlistLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Dog className="w-5 h-5 mr-2" />
                )}
                Join waitlist
              </Button>
            )
          )}
        </div>
      )}
      {petOptions.length > 0 && (
        <div className="w-full">
          <h2 className="text-2xl font-semibold tracking-tight text-center mb-2">
            Select your pet
          </h2>
          <Carousel setApi={setCarouselApi} className="w-full">
            <CarouselContent>
              {petOptions.map((petOption, index) => (
                <CarouselItem key={index}>
                  <PetOptionCard petOption={petOption} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="flex justify-center mt-4 gap-4">
            <Button
              size="lg"
              onClick={scrollPrev}
              disabled={currentPetIndex === 0}
              className="w-full"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              size="lg"
              onClick={scrollNext}
              disabled={currentPetIndex === petOptions.length - 1}
              className="w-full"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          {/* reset choices button */}
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={handleResetChoices}
          >
            Reset choices
          </Button>
        </div>
      )}
    </div>
  );
}
