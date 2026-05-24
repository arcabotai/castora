import React, { useEffect, useState, useRef } from 'react';
import { ChartBarIcon, GifIcon, HomeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'sonner';
import { HOST_URL } from '@/utils/hostURL';

import { classNames } from '@/utils/classNames'

import { DebounceInput } from 'react-debounce-input';
import { isMobile } from 'react-device-detect';

import { Channel } from '@/types';
import { useQuery } from 'react-query';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import { usePrivy } from '@privy-io/react-auth';
import { DRAFT_SEND_STATUS, Draft } from '@prisma/client';
import { useCurrentChannel } from '@/providers/CurrentChannelProvider';
import Spinner from '../Spinner';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerTrigger } from '../ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface Props {
  currentDraft: Draft,
  setCurrentDraft: (draft: Draft) => void
  updateExistingDraftInColumn: (updatedDraft: any) => void;
}

export default function ChannelPickerButton(props: Props) {

  const { supercastUserState, isSuperanon } = useSupercastUserState()
  const { ready, authenticated, getAccessToken } = usePrivy()
  const { currentChannel, setCurrentChannel } = useCurrentChannel()

  const [openChannelPicker, setOpenChannelPicker] = useState(false)

  const { currentDraft, setCurrentDraft, updateExistingDraftInColumn } = props

  const [channelLookupValue, setChannelLookupValue] = useState<string>()
  const [channelLookupResults, setChannelLookupResults] = useState([])
  const [loadingChannelSelection, setLoadingChannelSelection] = useState(false)

  const channelLookupInputRef = useRef(null)

  const resultRefs = useRef([]);
  resultRefs.current = resultRefs.current.slice(0, 10);

  const [focusedIndex, setFocusedIndex] = useState(-1);

  const fetchTrendingChannels = async () => {

    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/channels/trending`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
    return response.data;
  };

  const fetchUserChannels = async () => {
    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/channels/user-channels?fid=${supercastUserState.currentFid}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
    return response.data;
  }

  const trendingChannelsQuery = useQuery(
    ['trendingChannels'],
    fetchTrendingChannels,
    {
      enabled: ready && authenticated
    }
  );

  const userChannelsQuery = useQuery(
    ['userChannels', supercastUserState],
    fetchUserChannels,
    {
      enabled: !!supercastUserState && ready && authenticated
    }
  );

  const searchChannels = async (query: string) => {

    const accessToken = await getAccessToken()

    axios.get(`${HOST_URL}/api/channels/search?query=${query}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    }).then(res => {
      setChannelLookupResults(res.data.channels.slice(0, 5))
    }).catch(err => {
      console.log(err)
    })
  }

  useEffect(() => {
    if (!channelLookupValue) {
      setChannelLookupResults([])
      setFocusedIndex(-1)
    } else {
      searchChannels(channelLookupValue)
    }

  }, [channelLookupValue])

  const handleSelectChannel = async (channel: Channel) => {
    setCurrentChannel(channel)
    setChannelLookupResults([])
    setFocusedIndex(-1)
    setChannelLookupValue("")
    setOpenChannelPicker(false)
    setLoadingChannelSelection(true)

    // update the draft with the selected channel
    const accessToken = await getAccessToken()

    axios.put(`${HOST_URL}/api/drafts/${currentDraft.id}`,
      { channelId: channel.id }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    }).then((res) => {
      setCurrentDraft(res.data.draft)
      updateExistingDraftInColumn(res.data.draft)
    }).catch((err) => {
      console.log(err)
    }).finally(() => {
      setLoadingChannelSelection(false)
    })
  }

  useEffect(() => {
    if (openChannelPicker && channelLookupInputRef.current) {
      channelLookupInputRef.current.focus()
    }
  }, [openChannelPicker, channelLookupInputRef])

  useEffect(() => {
    const handleKeyDown = (e) => {
      // should only work when the search input or the results are focused
      if (e.target !== channelLookupInputRef.current && !resultRefs.current.includes(e.target)) {
        return;
      }

      let newIndex;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (focusedIndex === channelLookupResults.length - 1) {
          return;
        }
        newIndex = focusedIndex + 1;
        setFocusedIndex(newIndex);

      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (focusedIndex === -1) {
          return;
        }
        newIndex = focusedIndex - 1;
        setFocusedIndex(newIndex);
      }

      if (newIndex !== undefined && resultRefs.current[newIndex]) {
        resultRefs.current[newIndex].focus(); // Focus the new item
      }

      if (newIndex === -1) {
        channelLookupInputRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [channelLookupResults, focusedIndex]);

  const renderChannelPickerContent = () => (
    <div className='py-2 flex flex-col gap-y-1 bg-white w-full dark:bg-gray-800 dark:text-gray-100 rounded-md'>
      <div className='text-sm text-gray-900 w-full px-4 mx-auto'>
        <DebounceInput
          rows={1}
          debounceTimeout={500}
          value={channelLookupValue}
          onChange={(e) => setChannelLookupValue(e.target.value)}
          className="w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:focus:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700 focus:border-transparent"
          placeholder="Select channel"
          inputRef={channelLookupInputRef}
        />
      </div>
      {/* if there is a channel selected, display a small text that says "remove channel" that removes the channel selection after clicking */}
      {currentChannel && (
        <div className='py-2 px-4'>
          <button
            onClick={() => {
              setCurrentChannel(null)
              setOpenChannelPicker(false)
            }}
            className="w-full flex flex-row items-center space-x-2 py-2 px-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none dark:border-gray-800 hover:cursor-pointer"
          >
            <div className="text-sm text-gray-900 dark:text-gray-200 flex flex-row justify-between items-center w-full">
              <p>Remove channel</p>
              <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
          </button>
        </div>
      )}
      {channelLookupResults.length > 0 && (
        <div className='py-2 px-4'>
          <div className='text-xs text-gray-900 dark:text-gray-400 font-semibold'>Search results</div>
          {channelLookupResults.map((channel, index) => (
            <div key={channel.id}>
              <button
                key={channel.id}
                onClick={() => handleSelectChannel(channel)}
                className={`w-full flex flex-row items-center space-x-2 py-2 px-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none dark:border-gray-800 hover:cursor-pointer`}
                ref={(el) => (resultRefs.current[index] = el)}
              >
                <img src={channel.image_url} className="inline-block h-6 w-6 rounded-full bg-gray-100 object-cover"></img>
                <div className="min-w-0 flex-1 flex flex-row items-center justify-between">
                  <div className="flex flex-row items-center">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-200 truncate mr-1">/{channel.id}</div>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{new Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    compactDisplay: 'short',
                  }).format(channel.follower_count)} members</div>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
      <div className='flex flex-col lg:flex-row'>
        {channelLookupResults.length === 0 && userChannelsQuery.data && (
          <div className='py-2 px-4 lg:w-1/2'>
            <div className='text-xs text-gray-900 dark:text-gray-400 font-semibold'>Your channels</div>
            {userChannelsQuery.data.channels.slice(0, isMobile ? 3 : 5).map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleSelectChannel(channel)}
                className={`w-full flex flex-row items-center space-x-2 py-2 px-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 focus:outline-none dark:border-gray-800 hover:cursor-pointer`}
              >
                <img src={channel.image_url} className="inline-block h-6 w-6 rounded-full bg-gray-100 object-cover"></img>
                <div className="min-w-0 flex-1 flex flex-row items-center justify-between">
                  <div className="flex flex-row items-center">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-200 truncate mr-1">/{channel.id}</div>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{new Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    compactDisplay: 'short',
                  }).format(channel.follower_count)} members</div>
                </div>
              </button>
            ))}
          </div>
        )}
        {channelLookupResults.length === 0 && trendingChannelsQuery.data && (
          <div className='py-2 px-4 lg:w-1/2'>
            <div className='text-xs text-gray-900 dark:text-gray-400 font-semibold'>Trending channels</div>
            {trendingChannelsQuery.data.channels.slice(0, isMobile ? 3 : 5).map((channelObject) => (
              <button
                key={channelObject.channel.id}
                onClick={() => handleSelectChannel(channelObject.channel)}
                className={`w-full flex flex-row items-center space-x-2 py-2 px-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 focus:outline-none dark:border-gray-800 hover:cursor-pointer`}
              >
                <img src={channelObject.channel.image_url} className="inline-block h-6 w-6 rounded-full bg-gray-100 object-cover"></img>
                <div className="min-w-0 flex-1 flex flex-row items-center justify-between">
                  <div className="flex flex-row items-center">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-200 truncate mr-1">/{channelObject.channel.id}</div>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{new Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    compactDisplay: 'short',
                  }).format(channelObject.channel.follower_count)} members</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const isDisabled = !currentDraft
    || (!!currentDraft && (
      currentDraft.sendStatus === DRAFT_SEND_STATUS.SENT
      || currentDraft.sendStatus === DRAFT_SEND_STATUS.SCHEDULED
      || currentDraft.isAnon
    ))
    || isSuperanon()

  return (
    <div className="flex items-center relative">
      {isMobile ? (
        <Drawer open={openChannelPicker} onOpenChange={setOpenChannelPicker}>
          <DrawerTrigger asChild>
            <Button
              variant='outline'
              className={`w-full h-9 px-3`}
              disabled={isDisabled}
            >
              {loadingChannelSelection ? (
                <Spinner width='w-5' height='h-5' margin='m-0' padding='p-0' />
              ) :
                (!!currentChannel && !!currentDraft?.channelId && currentDraft?.channelId == currentChannel.id) ?
                  <div className='flex flex-row items-center justify-center gap-x-2'>
                    <div className='w-5 h-5'>
                      <Avatar>
                        <AvatarImage src={currentChannel.image_url} alt={currentChannel.name} />
                        <AvatarFallback></AvatarFallback>
                      </Avatar>
                    </div>
                    <div className='hidden lg:block'>
                      {currentChannel.id}
                    </div>
                  </div>
                  :
                  <div className='flex flex-row items-center justify-center gap-x-2'>
                    <HomeIcon className="h-5 w-5 lg:h-4 lg:w-4 text-gray-500 lg:text-black" />
                    <div className='hidden lg:block'>
                      Pick channel
                    </div>
                  </div>
              }
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            {renderChannelPickerContent()}
            <DrawerFooter>
              <DrawerClose>
                <Button variant='secondary' className='w-full'>Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={openChannelPicker} onOpenChange={setOpenChannelPicker}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className={`w-full h-auto px-auto`}
              disabled={isDisabled}
            >
              {loadingChannelSelection ? (
                <Spinner width='w-5' height='h-5' margin='m-0' padding='p-0' />
              ) :
                (!!currentChannel && !!currentDraft?.channelId && currentDraft?.channelId == currentChannel.id) ?
                  <div className='flex flex-row items-center justify-center gap-x-2'>
                    <div className='w-5 h-5'>
                      <Avatar>
                        <AvatarImage src={currentChannel.image_url} alt={currentChannel.name} />
                        <AvatarFallback></AvatarFallback>
                      </Avatar>
                    </div>
                    <div className='hidden lg:block'>
                      {currentChannel.id}
                    </div>
                  </div>
                  :
                  <div className='flex flex-row items-center justify-center gap-x-2'>
                    <HomeIcon className="h-5 w-5 lg:h-4 lg:w-4 text-gray-500 lg:text-black lg:dark:text-white" />
                    <div className='hidden lg:block'>
                      Pick channel
                    </div>
                  </div>
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            {renderChannelPickerContent()}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}