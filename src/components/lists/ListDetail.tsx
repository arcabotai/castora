'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useQuery, useQueryClient } from 'react-query'
import { XMarkIcon, PencilIcon, PlusIcon, MinusIcon, ShareIcon, LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/solid'
import { HOST_URL } from '@/utils/hostURL'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import Spinner from '../Spinner'
import { Skeleton } from "../ui/skeleton"
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '../ui/button'
import { DebounceInput } from 'react-debounce-input'
import PowerBadge from '../PowerBadge'
import { toast } from 'sonner'
import PrivateListToggle from './PrivateListToggle'
import { useSelectedList } from '@/providers/SelectedListProvider'
import { ArrowUpTrayIcon, HomeIcon, TrashIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { ListIcon, Loader2 } from "lucide-react"
import { useIosPwa } from "@/providers/iOSPwaProvider"
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

interface ListDetailProps {
  isColumn: boolean
}

const ListDetailSkeleton = () => (
  <div className="p-4 space-y-4 min-h-screen flex flex-col">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    <Skeleton className="h-4 w-32" />
    <div className="space-y-2 flex-grow">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-center space-x-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
)

export default function ListDetail({ isColumn }: ListDetailProps) {

  const { supercastUserState } = useSupercastUserState()
  const { ready, authenticated, getAccessToken } = usePrivy()
  const [isEditing, setIsEditing] = useState(false)
  const [listName, setListName] = useState('')
  const [searchInput, setSearchInput] = useState("")
  const [profileSuggestions, setProfileSuggestions] = useState([])
  const [loadingAddMember, setLoadingAddMember] = useState(0)
  const [loadingRemoveMember, setLoadingRemoveMember] = useState(0)
  const [isPrivate, setIsPrivate] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoadingFollow, setIsLoadingFollow] = useState(false)
  const { editedList, setEditedList, setSelectedList } = useSelectedList()
  const queryClient = useQueryClient()
  const router = useRouter();
  const { isIosPwa } = useIosPwa()
  const [isSaving, setIsSaving] = useState(false)

  const fetchListDetails = async () => {
    const accessToken = await getAccessToken()
    const response = await axios.get(`${HOST_URL}/api/lists/${editedList.id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
    return response.data
  }

  const listQuery = useQuery(
    ['listDetail', editedList, supercastUserState.currentFid],
    fetchListDetails,
    {
      enabled: !!supercastUserState.currentFid && !!editedList && ready && authenticated,
    }
  )

  useEffect(() => {
    if (listQuery.data) {
      setListName(listQuery.data.list.name)
      setIsPrivate(listQuery.data.list.private)
      setIsFollowing(listQuery.data.list.followingStatus)
    }
  }, [listQuery.data])

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleSaveClick = async () => {
    setIsSaving(true)
    const accessToken = await getAccessToken()
    try {
      await axios.put(`${HOST_URL}/api/lists/${editedList.id}`,
        { name: listName },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'asFid': supercastUserState.currentFid,
          }
        }
      )
      setIsEditing(false)
      listQuery.refetch()
    } catch (error) {
      console.error('Error updating list name:', error)
      toast.error('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFollowToggle = async () => {
    setIsLoadingFollow(true)
    const accessToken = await getAccessToken()

    try {
      if (isFollowing) {
        await axios.post(`${HOST_URL}/api/lists/${editedList.id}/unfollow`, {}, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'asFid': supercastUserState.currentFid,
          }
        })
      } else {
        await axios.post(`${HOST_URL}/api/lists/${editedList.id}/follow`, {}, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'asFid': supercastUserState.currentFid,
          }
        })
      }
      setIsFollowing(!isFollowing)
      listQuery.refetch()
    } catch (error) {
      console.error('Error toggling follow status:', error)
      toast.error('Failed to update follow status')
    } finally {
      setIsLoadingFollow(false)
    }
  }

  const handleChangePrivateStatus = async (publicStatus: boolean) => {
    const accessToken = await getAccessToken()
    const endpoint = publicStatus ? 'make-public' : 'make-private'

    setIsPrivate(!publicStatus)

    try {
      await axios.put(`${HOST_URL}/api/lists/${editedList.id}/${endpoint}`, {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          "asFid": supercastUserState.currentFid
        }
      })
      toast.success(`Your list is now ${publicStatus ? 'public' : 'private'}`)
      setIsPrivate(!publicStatus)
      listQuery.refetch()
    } catch (error) {
      console.error('Error changing list privacy:', error)
      setIsPrivate(publicStatus)
      toast.error('Something went wrong')
    }
  }

  const searchProfileSuggestions = async (query: string) => {
    const accessToken = await getAccessToken()
    try {
      const res = await axios.get(`${HOST_URL}/api/profile/search?query=${query}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'asFid': supercastUserState.currentFid,
        }
      })
      setProfileSuggestions(res.data.users.slice(0, 3))
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    if (searchInput.length === 0) {
      setProfileSuggestions([])
    } else {
      searchProfileSuggestions(searchInput)
    }
  }, [searchInput])

  const addMember = async (user) => {
    setLoadingAddMember(user.fid)
    const accessToken = await getAccessToken()
    try {
      await axios.post(`${HOST_URL}/api/lists/${editedList.id}/add-member`,
        { memberFid: user.fid },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'asFid': supercastUserState.currentFid,
          }
        }
      )
      setSearchInput("")
      listQuery.refetch()
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error('Something went wrong')
    } finally {
      setLoadingAddMember(0)
    }
  }

  const removeMember = async (memberFid) => {
    setLoadingRemoveMember(memberFid)
    const accessToken = await getAccessToken()
    try {
      await axios.delete(`${HOST_URL}/api/lists/${editedList.id}/remove-member`, {
        data: { memberFid },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'asFid': supercastUserState.currentFid,
        }
      })
      toast.success('Member removed')
      listQuery.refetch()
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Something went wrong')
    } finally {
      setLoadingRemoveMember(0)
    }
  }

  const handleShareList = () => {
    const listUrl = `${window.location.origin}/lists/${editedList.id}`
    navigator.clipboard.writeText(listUrl).then(() => {
      toast.success('List link copied to clipboard')
    }, (err) => {
      console.error('Could not copy text: ', err)
      toast.error('Failed to copy link')
    })
  }

  const handleDeleteList = async () => {
    const accessToken = await getAccessToken()
    try {
      await axios.delete(`${HOST_URL}/api/lists/${editedList.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'asFid': supercastUserState.currentFid,
        }
      })
      toast.success('List deleted')
      setEditedList(null)
      // Invalidate and refetch myListsQuery
      queryClient.invalidateQueries(`myLists-${supercastUserState.currentFid}`)
    } catch (error) {
      console.error('Error deleting list:', error)
      toast.error('Failed to delete list')
    }
  }

  const handleGoToFeed = () => {
    localStorage.setItem('selectedList', JSON.stringify({
      id: listQuery.data.list.id,
      name: listQuery.data.list.name,
    }))
    setEditedList(null)
    router.push('/')
  }

  // New useEffect to turn off editing when editedList changes
  useEffect(() => {
    setIsEditing(false)
  }, [editedList])

  if (!editedList || !editedList.id) {
    return null
  }

  const isAuthor = listQuery.data?.author.fid === supercastUserState.currentFid

  const topLevelClassName = isColumn
    ? 'fixed top-0 flex flex-col max-h-screen overflow-y-auto min-h-screen max-w-[400px] w-full'
    : 'fixed inset-0 z-[51] overflow-y-auto overscroll-none bg-black bg-opacity-50 flex justify-center items-start max-h-screen lg:hidden'

  return (
    <div className={topLevelClassName}>
      {listQuery.isLoading ? (
        <div className="relative bg-white dark:bg-gray-900 w-full min-h-screen max-h-screen shadow-xl flex flex-col">
          <ListDetailSkeleton />
        </div>
      ) : (
        <div className="relative bg-white dark:bg-gray-900 w-full min-h-screen max-h-screen shadow-xl flex flex-col">
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-4 py-2">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                {isEditing ? (
                  <input
                    type="text"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    className="bg-transparent border-b border-gray-300 dark:border-gray-700 focus:outline-none focus:border-black"
                  />
                ) : (
                  <div className="flex items-center gap-x-2">
                    {listQuery.data?.list.name || 'List details'}
                    {/* by author */}
                    <span className="text-sm text-gray-500 flex items-center gap-x-1 font-normal">
                      <p>by</p>
                      <p>@{listQuery.data?.author.username}</p>
                      <Avatar className='h-4 w-4'>
                        <AvatarImage
                          src={listQuery.data.author.pfp_url}
                          alt='Profile picture'
                        />
                        <AvatarFallback>
                          <Skeleton
                            className="h-4 w-4"
                          />
                        </AvatarFallback>
                      </Avatar>
                    </span>
                  </div>
                )}
              </h2>
              <button
                onClick={() => setEditedList(null)}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="py-2 flex-grow overflow-y-auto">
            <div className="p-4">
              <div className="flex flex-row items-center gap-x-2 text-lg font-semibold">
                <h4 className="">{listQuery.data.list.membershipCount} Members</h4>
                <h4 className="text-gray-500 font-normal">{listQuery.data.list.followingCount} Followers</h4>
              </div>
              {isEditing && (
                <div className="mb-4">
                  <DebounceInput
                    className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 border rounded-md py-2 px-4 sm:text-sm focus:outline-none"
                    debounceTimeout={500}
                    placeholder="Search users to add"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <div className={`flex flex-col mt-2 ${profileSuggestions.length > 0 && "divide-y border dark:border-gray-800 rounded-md"}`}>
                    {profileSuggestions.map((user, index) => (
                      <div
                        key={user.fid}
                        onClick={() => addMember(user)}
                        className={`flex flex-row items-center space-x-2 py-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none dark:border-gray-800 hover:cursor-pointer ${index === profileSuggestions.length - 1 && 'rounded-b-md'} ${index === 0 && 'rounded-t-md'}`}
                      >
                        <img src={user.pfp_url} className="inline-block h-8 w-8 rounded-full bg-gray-100 object-cover"></img>
                        <div className="min-w-0 flex-1 flex flex-row items-center justify-between">
                          <div className="flex flex-row items-center">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mr-1 max-w-[120px]">{user.display_name}</div>
                            {user.power_badge && <span className="mr-1"><PowerBadge /></span>}
                            <div className="text-sm text-gray-500 max-w-[110px] truncate">@{user.username}</div>
                          </div>
                          {loadingAddMember === user.fid
                            ? <Spinner width='w-4' height='h-4' padding='p-0' margin='mr-0' />
                            : <PlusIcon className="h-4 w-4 text-gray-400" />
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {listQuery.data.members.length > 0 ? (
                <ul className="space-y-2">
                  {listQuery.data.members.map((member) => (
                    <li key={member.fid} className="flex items-center justify-between">
                      <Link href={`/${member.username}`} className="flex items-center">
                        <Avatar className='h-8 w-8 mr-2'>
                          <AvatarImage
                            src={member.pfp_url}
                            alt='Profile picture'
                          />
                          <AvatarFallback>
                            <Skeleton
                              className="h-8 w-8"
                            />
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.display_name}</span>
                        <span className="text-sm text-gray-500 ml-2">@{member.username}</span>
                      </Link>
                      {isEditing && (
                        <Button
                          onClick={() => removeMember(member.fid)}
                          size="sm"
                          variant="outline"
                          className="ml-2"
                          disabled={loadingRemoveMember === member.fid}
                        >
                          {loadingRemoveMember === member.fid ? (
                            <Spinner width='w-4' height='h-4' padding='p-0' />
                          ) : (
                            <TrashIcon className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center text-base sm:text-sm mt-4">List is empty</p>
              )}
            </div>
          </div>

          <div className={`w-full p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-y-2 ${isIosPwa ? 'pb-12' : ''}`}>
            {isAuthor && (
              isEditing ? (
                <div className="flex items-center justify-between">
                  <PrivateListToggle
                    publicStatus={!isPrivate}
                    handleChangePrivateStatus={handleChangePrivateStatus}
                  />
                  <Button
                    onClick={handleDeleteList}
                    size="sm"
                    variant="destructive"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-x-1 justify-start">
                  <span className="text-sm text-gray-500">
                    {isPrivate ? 'Private' : 'Public'} list
                  </span>
                  {isPrivate ? (
                    <LockClosedIcon className="h-4 w-4 text-gray-500" />
                  ) : (
                    <GlobeAltIcon className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              )
            )}
            {!isEditing && (
              <div className="flex items-center gap-x-1">
                <Button
                  onClick={handleShareList}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button
                  onClick={handleGoToFeed}
                  variant="outline"
                  className="w-full"
                >
                  <HomeIcon className="h-4 w-4 mr-2" />
                  Go to feed
                </Button>
              </div>
            )}
            {(!listQuery.isLoading && isAuthor) && (
              <Button
                onClick={isEditing ? handleSaveClick : handleEditClick}
                className="w-full"
                disabled={isSaving}
              >
                {isEditing ? (
                  isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save changes"
                  )
                ) : (
                  <>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </>
                )}
              </Button>
            )}
            {(!listQuery.isLoading && !isAuthor) && (
              <Button
                onClick={handleFollowToggle}
                disabled={isLoadingFollow}
                variant={isFollowing ? "secondary" : "default"}
                className="w-full"
              >
                {isLoadingFollow ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isFollowing ? (
                  <CheckIcon className="h-4 w-4 mr-2" />
                ) : (
                  <PlusIcon className="h-4 w-4 mr-2" />
                )}
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
