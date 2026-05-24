'use client'
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid"
import { useCallback, useEffect, useState } from "react"

import MoxieWidget from "./MoxieWidget"
import DegenWidget from "./DegenWidget"

export default function EcosystemCarousel() {

  const [ecosystemCarouselAPI, setEcosystemCarouselAPI] = useState<CarouselApi>()

  const [currentWidgetIndex, setCurrentWidgetIndex] = useState(0)

  const scrollPrevChannel = useCallback(() => {
    if (ecosystemCarouselAPI) ecosystemCarouselAPI.scrollPrev()
  }, [ecosystemCarouselAPI])

  const scrollNextChannel = useCallback(() => {
    if (ecosystemCarouselAPI) ecosystemCarouselAPI.scrollNext()
  }, [ecosystemCarouselAPI])


  useEffect(() => {
    if (!ecosystemCarouselAPI) return
    setCurrentWidgetIndex(ecosystemCarouselAPI.selectedScrollSnap() + 1)

    ecosystemCarouselAPI.on("select", () => {
      setCurrentWidgetIndex(ecosystemCarouselAPI.selectedScrollSnap() + 1)
    })
  }, [ecosystemCarouselAPI])

  return (
    <div>
      <Carousel setApi={setEcosystemCarouselAPI}>
        <div className="flex flex-col gap-y-2">
          <div className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Ecosystem</h2>
            <div className="flex flex-row items-center gap-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-full"
                onMouseDown={() => scrollPrevChannel()}
                disabled={currentWidgetIndex === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-full"
                onMouseDown={() => scrollNextChannel()}
                disabled={currentWidgetIndex === 2}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CarouselContent>
            <CarouselItem className="w-full">
              <DegenWidget />
            </CarouselItem>
            <CarouselItem className="w-full">
              <MoxieWidget />
            </CarouselItem>
          </CarouselContent>
        </div>
      </Carousel>
    </div>
  )
}
