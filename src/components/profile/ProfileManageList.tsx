import { XMarkIcon } from "@heroicons/react/24/outline"
import axios from "axios"

import { useEffect, useState } from 'react'

import ListPreviewProfile from "../ListPreviewProfile"
import { HOST_URL } from "@/utils/hostURL"
import { usePrivy } from "@privy-io/react-auth"
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider"

export default function ProfileManageList({ setRightColumnStatus, profile }: { setRightColumnStatus: Function, profile: any }) {

  const [lists, setLists] = useState([])
  const [loadingLists, setLoadingLists] = useState(false)

  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken, ready: privyReady } = usePrivy()

  const fetchLists = async () => {
    setLoadingLists(true)

    const accessToken = await getAccessToken()

    axios.get(`${HOST_URL}/api/lists/my-lists?isMember=${profile.fid}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
      .then((response) => {
        setLists(response.data.lists)
      })
      .catch((error) => {
        console.log(error)
      })
      .finally(() => {
        setLoadingLists(false)
      })
  }

  useEffect(() => {
    if (privyReady) {
      fetchLists()
    }
  }, [privyReady])

  return (
    <div>
      <div className='flex flex-row justify-between items-center py-2 px-4'>
        <button
          onClick={() => {
            setRightColumnStatus('')
          }}
          type="button"
          className="rounded-md py-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 flex flex-row items-center"
        >
          <XMarkIcon className="h-4 w-4 mr-2" />
          Manage lists
        </button>
      </div>
      <div>
        <ul className=''>
          {lists.map((list) => (
            <li
              // @ts-ignore TODO add list type
              key={list.id} className="border-b dark:border-gray-800"
            >
              <ListPreviewProfile list={list} profile={profile} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}