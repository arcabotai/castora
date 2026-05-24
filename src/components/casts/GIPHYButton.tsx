import React, { useState } from 'react';
import { GifIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { Grid } from '@giphy/react-components'
import { GiphyFetch } from '@giphy/js-fetch-api'
import { DebounceInput } from 'react-debounce-input';
import { isMobile } from 'react-device-detect';
import { DRAFT_SEND_STATUS, Draft } from '@prisma/client';
import { Button } from '../ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '../ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

// TODO type fix any
interface Props {
  currentDraft?: Draft;
  castEmbeds: any[]
  setCastEmbeds: React.Dispatch<React.SetStateAction<any[]>>
  small?: boolean
}

export default function GIPHYButton({ currentDraft, castEmbeds, setCastEmbeds, small }: Props) {
  const [openGIFGrid, setOpenGIFGrid] = useState(false)
  const [gifSearchTerm, setGifSearchTerm] = useState<string>('')

  const gf = new GiphyFetch('2VYnyLbRi7kAeO0j8606K2ZI0of7VQoY')

  const fetchGifs = (offset: number) => {
    if (!!gifSearchTerm) {
      return gf.search(gifSearchTerm, { offset, limit: 10 })
    } else {
      return gf.trending({ offset, limit: 10 })
    }
  }

  const handleGifClick = (gif: any, e: any) => {
    e.preventDefault()
    // do nothing if there are already 2 emebds
    if (castEmbeds.length >= 2) {
      // TODO disable the button completely
      toast.error('You can only have 2 embeds in the cast')
      return
    }
    setCastEmbeds([...castEmbeds, { "url": gif.images.original.url.slice(0, -5) }])
    setOpenGIFGrid(false)
  }

  const GifGrid = () => (
    <div className={`rounded-md p-2 mx-auto flex flex-col items-center gap-y-1 bg-white dark:bg-gray-950 dark:text-gray-100 ${isMobile ? 'w-[350px]' : 'w-[274px]'}`}>
      <DebounceInput
        debounceTimeout={1000}
        value={gifSearchTerm}
        onChange={(e) => setGifSearchTerm(e.target.value)}
        className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 border rounded-md py-2 px-4 sm:text-sm focus:outline-none"
        placeholder="Search gifs"
      />
      <div className='overflow-auto w-full mx-auto h-[340px]'>
        <Grid
          width={isMobile ? 350 : 272}
          columns={isMobile ? 2 : 1}
          fetchGifs={fetchGifs}
          onGifClick={(gif, e) => handleGifClick(gif, e)}
          className='mx-auto'
          key={gifSearchTerm}
        />
      </div>
    </div>
  )

  const isDisabled = castEmbeds.length >= 2 || (!!currentDraft && (currentDraft.sendStatus === DRAFT_SEND_STATUS.SENT || currentDraft.sendStatus === DRAFT_SEND_STATUS.SCHEDULED));

  return (
    <div className="flex items-center gap-x-2 relative">
      {isMobile ? (
        <Drawer open={openGIFGrid} onOpenChange={setOpenGIFGrid}>
          <DrawerTrigger asChild>
            <Button
              className="flex flex-row items-center justify-center"
              variant='outline'
              size='sm'
              disabled={isDisabled}
            >
              <GifIcon className='w-5 h-5 text-gray-500' />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="p-0">
            <div className={`rounded-md p-2 mx-auto flex flex-col items-center gap-y-1 bg-white dark:bg-gray-950 dark:text-gray-100 ${isMobile ? 'w-[350px]' : 'w-[274px]'}`}>
              <DebounceInput
                debounceTimeout={1000}
                value={gifSearchTerm}
                onChange={(e) => setGifSearchTerm(e.target.value)}
                className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 border rounded-md py-2 px-4 sm:text-sm focus:outline-none"
                placeholder="Search gifs"
              />
              <div className='overflow-auto w-full mx-auto h-[340px]'>
                <Grid
                  width={isMobile ? 350 : 272}
                  columns={isMobile ? 2 : 1}
                  fetchGifs={fetchGifs}
                  onGifClick={(gif, e) => handleGifClick(gif, e)}
                  className='mx-auto'
                  key={gifSearchTerm}
                />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={openGIFGrid} onOpenChange={setOpenGIFGrid}>
          <PopoverTrigger asChild>
            <Button
              className="flex flex-row items-center justify-center"
              variant='outline'
              size='sm'
              disabled={isDisabled}
            >
              <GifIcon className='w-5 h-5 text-gray-500' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="center">
            <GifGrid />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
