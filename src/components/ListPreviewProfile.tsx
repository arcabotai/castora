'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

import { HOST_URL } from '@/utils/hostURL'
import { usePrivy } from '@privy-io/react-auth'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'

export default function ListPreviewProfile({ list, profile }: { list: any, profile: any }) {

  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()

  const [isMemberStatus, setIsMemberStatus] = useState(list.isMember)
  const [authorUsername, setAuthorUsername] = useState('')

  const handleRemoveFromList = async () => {

    const accessToken = await getAccessToken()

    axios.delete(`${HOST_URL}/api/lists/${list.id}/remove-member`, {
      data: { "memberFid": profile.fid },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        "asFid": supercastUserState.currentFid
      }
    })
      .then((response) => {
        toast.success('Member removed')
        setIsMemberStatus(false)
      })
      .catch((error) => {
        console.log(error)
        toast.error('Error while removing a member')
      })
  }

  const handleAddToList = async () => {

    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/lists/${list.id}/add-member`, { "memberFid": profile.fid }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        "asFid": supercastUserState.currentFid
      }
    })
      .then(res => {
        toast.success('Member added')
        setIsMemberStatus(true)
      })
      .catch(err => {
        console.log(err)
        toast.error('Error while adding a member')
      })
  }


  useEffect(() => {
    if (!!list) {
      // get author username by fid
      axios.get(`${HOST_URL}/api/profile?fid=${list.authorFid}`)
        .then((response) => {
          setAuthorUsername(response.data.user.username)
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }, [list])

  return (
    <div className="flex flex-row hover:bg-gray-50 dark:hover:bg-gray-800 group px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex flex-col flex-grow">
        <div className='flex flex-row items-center'>
          <span className='text-sm dark:text-gray-100 font-semibold'>{list.name}</span>
          <span className='text-gray-500 mx-1'>·</span>
          <span className='text-xs text-gray-500'>by @{authorUsername}</span>
        </div>
        <div className='flex flex-row items-center'>
          <span className='text-xs text-gray-500'>{list.membershipCount} members</span>
          <span className='text-gray-500 mx-1'></span>
          <span className='text-xs text-gray-500'>{list.followingCount} followers</span>
        </div>
      </div>
      <div className='flex-shrink-0'>
        {isMemberStatus ? (
          <div>
            <span className='bg-gray-200 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full group-hover:hidden'>In the list</span>
            <button
              onClick={() => handleRemoveFromList()}
              className='bg-red-500 text-white text-xs font-semibold px-4 py-1 rounded-full hidden group-hover:block'>
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleAddToList()}
            className='text-gray-900 bg-white border border-gray-900 text-xs font-semibold px-3 py-1 rounded-full group-hover:bg-green-500 group-hover:text-white group-hover:border-0'>
            Add to the list
          </button>
        )}
      </div>
    </div>
  )
}
