import { Fragment, use, useEffect, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline'

import { toast } from 'sonner'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import axios from 'axios'
import { usePrivy } from '@privy-io/react-auth'
import { LockOpenIcon } from '@heroicons/react/24/outline'
import { DebounceInput } from 'react-debounce-input'
import { HOST_URL } from '@/utils/hostURL'
import PowerBadge from './PowerBadge'
import { useQuery } from 'react-query'
import Spinner from './Spinner'
import { Button } from './ui/button'
import queryClient from '@/lib/queryClient'
import { useOpenSignerApproval } from '@/providers/OpenSignerApprovalProvider'

export default function ShareAccountModal({ open, setOpen, shareFid, shareUsername }: { open: boolean, setOpen: React.Dispatch<React.SetStateAction<boolean>>, shareFid: number, shareUsername: string }) {

  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()
  const cancelButtonRef = useRef(null)

  const searchInputRef = useRef(null)
  const [searchInput, setSearchInput] = useState("")
  const [profileSuggestions, setProfileSuggestions] = useState([])
  const [sharedWithProfiles, setSharedWithProfiles] = useState([])
  const [loadingShareFid, setLoadingShareFid] = useState(0)
  const [loadingRemoveFid, setLoadingRemoveFid] = useState(0)

  const { setOpenSignerApproval } = useOpenSignerApproval()

  const shareAccount = async (user) => {

    setLoadingShareFid(user.fid)

    const accessToken = await getAccessToken()

    axios.post('/api/account/delegate-access', {
      delegateTo: user.fid
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'asFid': shareFid
      }
    }).then((response) => {
      setSearchInput("")
      toast.success('Account shared')
      setSharedWithProfiles((prev) => [user, ...prev])
      queryClient.invalidateQueries('sharedTo')
    }).catch((error) => {
      console.log(error)
      if (error.response.data.error === "NOT_SUPERCAST_USER") {
        toast.error('Not a Castora user')
        return
      }
      if (error.response.data.error === "CANNOT_DELEGATE_TO_SELF") {
        toast.error("Can't share account with yourself")
        return
      }
      if (error.response.data.error === "NO_SIGNER_APPROVED") {
        setOpenSignerApproval(true)
        return
      }
      toast.error('Failed to share account')
    }).finally(() => {
      setLoadingShareFid(0)
    })
  }

  const removeAccess = async (user) => {

    setLoadingRemoveFid(user.fid)
    const accessToken = await getAccessToken()

    axios.delete('/api/account/remove-access', {
      data: {
        removeAccessFid: user.fid
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'asFid': shareFid
      }
    }).then((response) => {
      toast.success('Access removed')
      setSharedWithProfiles((prev) => prev.filter((u) => u.fid !== user.fid))
      queryClient.invalidateQueries('sharedTo')
    }
    ).catch((error) => {
      if (error.response.data.error === "NO_SIGNER_APPROVED") {
        setOpenSignerApproval(true)
      } else {
        console.log(error)
        toast.error('Failed to remove access')
      }
    }).finally(() => {
      setLoadingRemoveFid(0)
    })
  }

  const fetchSharedTo = async () => {

    const accessToken = await getAccessToken()

    return axios.get(`${HOST_URL}/api/account/shared-with`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'asFid': shareFid
      }
    })
  }

  const sharedToQuery = useQuery(
    ['sharedTo', shareFid, open],
    fetchSharedTo,
    { enabled: open && !!shareFid })

  const searchProfileSuggestions = async (query: string) => {

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
  }

  useEffect(() => {

    if (searchInput.length === 0) {
      setProfileSuggestions([])
    } else {
      searchProfileSuggestions(searchInput)
    }
  }, [searchInput])

  useEffect(() => {
    setSharedWithProfiles([])
  }, [open])

  useEffect(() => {
    if (sharedToQuery.isSuccess && sharedWithProfiles.length === 0) {
      setSharedWithProfiles(sharedToQuery.data.data.users)
    }
  }, [sharedToQuery.isSuccess])

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" initialFocus={cancelButtonRef} onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <LockOpenIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex flex-col gap-y-2">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                      Share access
                    </Dialog.Title>
                    <div className="">
                      <p className="text-sm text-gray-500">
                        Select users that should have access to @{shareUsername}. They need to have an active Castora account.
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <DebounceInput
                        inputRef={searchInputRef}
                        className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 border rounded-md py-2 px-4 sm:text-sm focus:outline-none"
                        debounceTimeout={500}
                        placeholder={`Search users to add`}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                      />
                    </div>
                    <div className={`flex flex-col ${profileSuggestions.length > 0 && "divide-y border dark:border-gray-800 rounded-md"}`}>
                      {profileSuggestions.map((user, index) => (
                        <div
                          key={user.fid}
                          onClick={() => shareAccount(user)}
                          className={`flex flex-row items-center space-x-2 py-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none dark:border-gray-800 hover:cursor-pointer ${index === profileSuggestions.length - 1 && 'rounded-b-md'} ${index === 0 && 'rounded-t-md'}`}
                        >
                          <img src={user.pfp_url} className="inline-block h-8 w-8 rounded-full bg-gray-100 object-cover"></img>
                          <div className="min-w-0 flex-1 flex flex-row items-center justify-between">
                            <div className="flex flex-row items-center">
                              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mr-1 max-w-[120px]">{user.display_name}</div>
                              {user.power_badge && <span className="mr-1"><PowerBadge /></span>}
                              <div className="text-sm text-gray-500 max-w-[110px] truncate">@{user.username}</div>
                            </div>
                            {loadingShareFid === user.fid
                              ?
                              <Spinner width='w-4' height='h-4' padding='p-0' margin='mr-2' />
                              : <div className="text-xs text-gray-500 truncate">{new Intl.NumberFormat('en-US', {
                                notation: 'compact',
                                compactDisplay: 'short',
                              }).format(user.follower_count)} followers</div>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                    {sharedToQuery.isLoading && <div className='text-xs flex items-center mx-auto text-gray-500'><Spinner width='w-4' height='h-4' padding='p-0' />Loading accounts with access to @{shareUsername}</div>}
                    {sharedToQuery.isSuccess && sharedWithProfiles.length === 0 && <div className='text-xs flex items-center mx-auto text-gray-500'>No accounts with access to @{shareUsername}</div>}
                    {sharedToQuery.isError && <div className='text-xs flex items-center mx-auto text-gray-500'>Failed to load accounts with access to @{shareUsername}</div>}
                    {sharedToQuery.isSuccess && sharedWithProfiles.length > 0 &&
                      sharedWithProfiles.map((user, index) => (
                        <div
                          key={user.fid}
                          className="flex flex-col sm:flex-row sm:items-center gap-y-2 sm:gap-y-0 space-x-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none dark:border-gray-800 hover:cursor-pointer rounded-md"
                        >
                          <div className='flex flex-row items-center flex-grow px-2'>
                            <img src={user.pfp_url} className="inline-block h-8 w-8 rounded-full bg-gray-100 object-cover mr-2"></img>
                            <div className="min-w-0 flex-1 flex flex-row items-center">
                              <div className="flex flex-row items-center">
                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mr-1 max-w-[120px]">{user.display_name}</div>
                                {user.power_badge && <span className="mr-1"><PowerBadge /></span>}
                                <div className="text-sm text-gray-500 max-w-[110px] truncate">@{user.username}</div>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant='destructive'
                            className='p-2 py-1 h-min flex items-center'
                            onClick={() => removeAccess(user)}
                          >
                            {loadingRemoveFid === user.fid && <Spinner width='w-4' height='h-4' padding='p-0' margin='mr-2' color='text-red-600' fill='fill-red-300' />}
                            Remove access
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
