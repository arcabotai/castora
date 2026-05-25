import { toast } from "sonner";
import { HOST_URL } from "@/utils/hostURL";
import axios from "axios";
import { isMobile } from "react-device-detect";

import { Button } from "@/components/ui/button"
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/ui/dialog"
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

import { DebounceInput } from "react-debounce-input";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import PowerBadge from "../PowerBadge";

import { useInfiniteQuery } from "react-query";
import { useInView } from 'react-intersection-observer';
import { XMarkIcon } from "@heroicons/react/20/solid";
import Spinner from "../Spinner";
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";
import { usePrivy } from "@privy-io/react-auth";

interface BoostRequestDialogContentProps {
  castHash: string
  isOpen: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function BoostRequestDialogContent({ castHash, isOpen, setOpen }: BoostRequestDialogContentProps) {
  const searchInputRef = useRef(null)
  const [searchInput, setSearchInput] = useState("")
  const [profileSuggestions, setProfileSuggestions] = useState([])
  const [recipientProfiles, setRecipientProfiles] = useState([])
  const [loadingBoostRequest, setLoadingBoostRequest] = useState(false)

  const { supercastUserState, isRegularUser } = useSupercastUserState()
  const { getAccessToken } = usePrivy()

  const fetchInfluentialFollowers = useCallback(async ({ pageParam = '' }) => {
    const accessToken = await getAccessToken()

    return axios.get(`${HOST_URL}/api/profile/most-influential-followers?cursor=${pageParam}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
      .then((response) => {
        return response.data
      })
  }, [getAccessToken, supercastUserState.currentFid])

  const influentialFollowersQuery = useInfiniteQuery('influentialFollowers', fetchInfluentialFollowers, {
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: isRegularUser() && isOpen,
  })

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && influentialFollowersQuery.hasNextPage && !influentialFollowersQuery.isFetchingNextPage) {
      influentialFollowersQuery.fetchNextPage();
    }
  }, [inView, influentialFollowersQuery.hasNextPage, influentialFollowersQuery.isFetchingNextPage, influentialFollowersQuery.fetchNextPage]);

  const searchProfileSuggestions = useCallback(async (query: string) => {
    const accessToken = await getAccessToken()

    axios.get(`${HOST_URL}/api/profile/search?query=${query}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
      .then(res => {
        setProfileSuggestions(res.data.users.slice(0, 3))
      })
      .catch(err => {
        console.log(err)
      })
  }, [getAccessToken, supercastUserState.currentFid])

  useEffect(() => {
    if (searchInput.length === 0) {
      setProfileSuggestions([])
    } else {
      searchProfileSuggestions(searchInput)
    }
  }, [searchInput, searchProfileSuggestions])

  const handleBoostRequest = useCallback(async (e) => {
    e.preventDefault()
    setLoadingBoostRequest(true)

    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/cast/boost-request`,
      {
        'hash': `${castHash}`,
        'recipientFids': recipientProfiles.map((p) => p.fid)
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'asFid': supercastUserState.currentFid,
        },
      }).then((response) => {
        toast.success('Boost request sent')
        console.log(response)
      }).catch((error) => {
        toast.error(error.response.data.error)
        console.log(error)
      }).finally(() => {
        setLoadingBoostRequest(false)
        setOpen(false)
      })
  }, [castHash, recipientProfiles, getAccessToken, supercastUserState.currentFid, setOpen])

  const addNewRecipient = useCallback((profile) => {
    if (recipientProfiles.length >= 20) {
      return
    }
    if (recipientProfiles.some((p) => p.fid === profile.fid)) {
      return
    }
    setRecipientProfiles(prev => [...prev, profile])
  }, [recipientProfiles])

  const removeRecipient = useCallback((profile) => {
    setRecipientProfiles(prev => prev.filter((p) => p.fid !== profile.fid))
  }, [])

  const Content = useMemo(() => ({ children }) => {
    if (isMobile) {
      return (
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Send a boost request</DrawerTitle>
            <DrawerDescription>
              Select up to 20 followers to send a boost request to.
            </DrawerDescription>
          </DrawerHeader>
          {children}
          <DrawerFooter>
            <p className="text-xs text-gray-500 text-center">You will receive a copy as well</p>
            <Button
              disabled={recipientProfiles.length === 0 || loadingBoostRequest}
              className="w-full"
              onClick={handleBoostRequest}
            >
              {loadingBoostRequest ? <Spinner width="w-5" height="h-5" padding="p-0" margin="m-0" /> : "Send request"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      )
    }

    return (
      <DialogContent className="w-full max-w-lg rounded-md">
        <DialogHeader>
          <DialogTitle>Send a boost request</DialogTitle>
          <DialogDescription>
            Select up to 20 followers to send a boost request to.
          </DialogDescription>
        </DialogHeader>
        {children}
        <div className="flex flex-col items-end gap-y-1">
          <Button
            disabled={recipientProfiles.length === 0 || loadingBoostRequest}
            className="w-32"
            onClick={handleBoostRequest}
          >
            {loadingBoostRequest ? <Spinner width="w-5" height="h-5" padding="p-0" margin="m-0" /> : "Send request"}
          </Button>
          <p className="text-xs text-gray-500">You will receive a copy as well</p>
        </div>
      </DialogContent>
    )
  }, [isMobile, recipientProfiles.length, loadingBoostRequest, handleBoostRequest])

  return (
    <Content>
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-col items-center px-4 sm:px-0">
          <DebounceInput
            inputRef={searchInputRef}
            className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 border rounded-md py-2 px-4 sm:text-sm focus:outline-none"
            debounceTimeout={500}
            placeholder={`Search followers`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="px-4 sm:px-0">
          <div className={`flex flex-col ${profileSuggestions.length > 0 && "divide-y border dark:border-gray-800 rounded-md"}`}>
            {profileSuggestions.map((user, index) => (
              <div
                key={user.fid}
                onClick={() => { addNewRecipient(user); setSearchInput("") }}
                className={`${user.viewer_context.followed_by ? 'block' : 'hidden'} flex flex-row items-center space-x-2 py-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none dark:border-gray-800 hover:cursor-pointer ${index === profileSuggestions.length - 1 && 'rounded-b-md'} ${index === 0 && 'rounded-t-md'}`}
              >
                <img src={user.pfp_url} className="inline-block h-8 w-8 rounded-full bg-gray-100 object-cover"></img>
                <div className="min-w-0 flex-1 flex flex-row items-center justify-between">
                  <div className="flex flex-row items-center min-w-0 overflow-hidden">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mr-1 max-w-full">{user.display_name}</div>
                    {user.power_badge && <span className="mr-1"><PowerBadge /></span>}
                    <div className="text-sm text-gray-500 max-w-full truncate">@{user.username}</div>
                  </div>
                  <div className="text-xs text-gray-500 truncate flex-shrink-0">{new Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    compactDisplay: 'short',
                  }).format(user.follower_count)} followers</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <h2 className="font-semibold text-sm tracking-tight px-4 sm:px-0 py-2 sm:py-0">Your most influential followers</h2>
        {influentialFollowersQuery.isLoading && <Spinner />}
        <div className={`flex flex-col overflow-auto ${profileSuggestions.length > 0 ? 'max-h-[150px]' : 'max-h-[300px]'}`}>
          {influentialFollowersQuery.isSuccess && (
            influentialFollowersQuery.data.pages.map((page, i) => (
              page.users.map((userObject) => (
                <div
                  onClick={() => addNewRecipient(userObject.user)}
                  key={userObject.user.fid}
                  className="flex flex-row items-center space-x-2 py-2 px-1 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none dark:border-gray-800 hover:cursor-pointer rounded-md"
                >
                  <img src={userObject.user.pfp_url} className="inline-block h-8 w-8 rounded-full bg-gray-100 object-cover"></img>
                  <div className="min-w-0 flex-1 flex flex-row items-center justify-between">
                    <div className="flex flex-row items-center min-w-0 overflow-hidden">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mr-1 max-w-full">{userObject.user.display_name}</div>
                      {userObject.user.power_badge && <span className="mr-1"><PowerBadge /></span>}
                      <div className="text-sm text-gray-500 max-w-full truncate">@{userObject.user.username}</div>
                    </div>
                    <div className="text-xs text-gray-500 truncate flex-shrink-0">{new Intl.NumberFormat('en-US', {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(userObject.user.follower_count)} followers</div>
                  </div>
                </div>
              ))
            ))
          )}
          <div ref={ref} className="h-1"></div>
          {influentialFollowersQuery.isFetchingNextPage && <Spinner />}
        </div>
        {recipientProfiles.length > 0 && (
          <div className="flex flex-row gap-x-2 gap-y-1 items-center flex-wrap">
            <p className="text-xs">Sending to:</p>
            {recipientProfiles.map((profile) => (
              // small pill with only profile picture and username and a cross
              <div key={profile.fid} className="flex flex-row items-center space-x-2 py-1 px-2 rounded-md bg-gray-100 dark:bg-gray-800">
                <img src={profile.pfp_url} className="inline-block h-3 w-3 rounded-full bg-gray-100 object-cover"></img>
                <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate mr-1 max-w-full">{profile.display_name}</div>
                <button onClick={() => removeRecipient(profile)}>
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Content>
  )
}
