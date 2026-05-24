'use client'
import { MagnifyingGlassCircleIcon } from "@heroicons/react/24/outline"
import { DebounceInput } from "react-debounce-input"
import { HOST_URL } from "@/utils/hostURL"

import { useEffect, useState, useRef } from "react"
import axios from "axios"

import { useSelectedCast } from '@/providers/SelectedCastProvider'
import Link from "next/link"
import PowerBadge from "../PowerBadge"
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider"
import { usePrivy } from "@privy-io/react-auth"

export default function SearchBar() {
  const { setHash } = useSelectedCast()
  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()

  const [searchInput, setSearchInput] = useState("")
  const [fromFilter, setFromFilter] = useState("")
  const [searchInputAfterFrom, setSearchInputAfterFrom] = useState("")
  const [profileSuggestions, setProfileSuggestions] = useState([])
  const [channelSuggestions, setChannelSuggestions] = useState([])
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const searchInputRef = useRef(null)

  const resultRefs = useRef([]);
  resultRefs.current = resultRefs.current.slice(0, 7);

  const searchCombined = async (query: string) => {
    const accessToken = await getAccessToken()

    try {
      const response = await axios.get(`${HOST_URL}/api/search-suggestions?query=${query}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'asFid': supercastUserState.currentFid,
        }
      })
      setChannelSuggestions(response.data.channels)
      setProfileSuggestions(response.data.users)
    } catch (err) {
      console.error('Error in combined search:', err)
    }
  }

  useEffect(() => {
    if (searchInput && searchInput.includes('from:')) {
      const fromUsername = searchInput.split('from:')[1].split(' ')[0]

      setSearchInputAfterFrom(searchInput.replace(`from:${fromUsername}`, ""))
      setFromFilter(fromUsername)
    } else {
      setSearchInputAfterFrom(searchInput)
    }

    if (searchInput.length === 0) {
      setProfileSuggestions([])
      setChannelSuggestions([])
      setFromFilter("")
    } else {
      searchCombined(searchInput)
    }
  }, [searchInput])

  useEffect(() => {
    if (profileSuggestions.length > 0) {
      if (searchInput.length === 0) {
        setProfileSuggestions([])
        setFocusedIndex(-1)
      }
    }
  }), [profileSuggestions]

  useEffect(() => {
    if (channelSuggestions.length > 0) {
      if (searchInput.length === 0) {
        setChannelSuggestions([])
        setFocusedIndex(-1)
      }
    }
  }), [channelSuggestions]

  useEffect(() => {
    const handleKeyDown = (e) => {
      // should only work when the search input or the results are focused
      if (e.target !== searchInputRef.current && !resultRefs.current.includes(e.target)) {
        return;
      }

      let newIndex;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (focusedIndex === profileSuggestions.length + channelSuggestions.length) {
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
        searchInputRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileSuggestions, channelSuggestions, focusedIndex]);

  const handleResultClick = () => {
    setSearchInput("");
    setProfileSuggestions([]);
    setChannelSuggestions([]);
  };

  return (
    <div>
      <div className="dark:border-gray-800 relative">
        <div className="flex flex-col items-center">
          <DebounceInput
            inputRef={searchInputRef}
            className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 border rounded-md py-2 px-4 sm:text-sm focus:outline-none"
            debounceTimeout={500}
            placeholder={`Search casts, users and channels`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className={`absolute w-full shadow rounded-md z-10 flex flex-col ${searchInput.length > 0 && "mt-2"}`}>
          <div className={`bg-white dark:bg-gray-800 dark:border-gray-700 rounded-md divide-y ${searchInput.length > 0 && 'border'}`}>
            {searchInput.length > 0 &&
              <Link
                href={`/explore?q=${searchInput}`}
                className={`flex flex-row items-center space-x-2 py-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none dark:border-gray-800 hover:cursor-pointer rounded-t-md ${profileSuggestions.length == 0 && 'rounded-b-md'}`}
                ref={(el) => (resultRefs.current[0] = el)}
                onClick={handleResultClick}
              >
                <div className="flex items-center justify-center h-8 w-8">
                  <MagnifyingGlassCircleIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                </div>
                <span className="text-sm text-gray-900 dark:text-gray-100">{'Search casts with '}<span className="font-semibold">{searchInputAfterFrom}</span>{!!fromFilter && ' from '}{!!fromFilter && <span className="font-semibold">@{fromFilter}</span>}</span>
              </Link>
            }
            {channelSuggestions.map((channel, index) => (
              <Link
                href={`/channel/${channel.id}`}
                key={channel.id}
                className={`flex flex-row items-center space-x-2 py-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none dark:border-gray-800 hover:cursor-pointer ${index === profileSuggestions.length - 1 && 'rounded-b-md'}`}
                ref={(el) => (resultRefs.current[index + 1] = el)}
                onClick={handleResultClick}
              >
                <img src={channel.image_url} className="inline-block h-8 w-8 rounded-full bg-gray-100 object-cover"></img>
                <div className="min-w-0 flex-1 flex flex-row items-center justify-between">
                  <div className="flex flex-row items-center">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mr-1 max-w-[110px] xs:max-w-[145px] sm:max-w-[280px]">{channel.name}</div>
                    <div className="text-sm text-gray-500 max-w-[90px] xs:max-w-[105px] sm:max-w-[200px] truncate">/{channel.id}</div>
                  </div>
                </div>
              </Link>
            ))}
            {profileSuggestions.map((user, index) => (
              <Link
                href={`/${user.username}`}
                key={user.fid}
                className={`flex flex-row items-center space-x-2 py-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none dark:border-gray-800 hover:cursor-pointer ${index === profileSuggestions.length - 1 && 'rounded-b-md'}`}
                ref={(el) => (resultRefs.current[index + channelSuggestions.length + 1] = el)}
                onClick={handleResultClick}
              >
                <img src={user.pfp_url} className="inline-block h-8 w-8 rounded-full bg-gray-100 object-cover"></img>
                <div className="min-w-0 flex-1 flex flex-row items-center justify-between">
                  <div className="flex flex-row items-center">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mr-1 max-w-[110px] xs:max-w-[145px] sm:max-w-[280px]">{user.display_name}</div>
                    {user.power_badge && <span className="mr-1"><PowerBadge /></span>}
                    <div className="text-sm text-gray-500 max-w-[90px] xs:max-w-[105px] sm:max-w-[200px] truncate">@{user.username}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div >
  )
}
