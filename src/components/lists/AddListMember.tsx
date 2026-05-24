'use client'

import { useEffect, useState } from 'react'

import axios from 'axios'
import { toast } from 'sonner'
import { DebounceInput } from 'react-debounce-input'
import { HOST_URL } from '@/utils/hostURL'
import { usePrivy } from '@privy-io/react-auth'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'

export default function AddListMember({ listId, setMembers }: { listId: number, setMembers: (members: any) => void }) {

  const [username, setUsername] = useState('')
  const [memberFid, setMemberFid] = useState(0)
  const [castSending, setCastSending] = useState(false)
  const [searchResultUsers, setSearchResultUsers] = useState([]) //TODO make it into usermin type

  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()

  const handleAdd = async () => {
    setCastSending(true)

    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/lists/${listId}/add-member`, { "memberFid": memberFid }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        "asFid": supercastUserState.currentFid
      }
    })
      .then(res => {
        setMembers(res.data.members)
        toast.success('Member added')
        setUsername('')
      })
      .catch(err => {
        console.log(err)
        toast.error('Something went wrong')
      })
      .finally(() => {
        setCastSending(false)
      })
  }

  const searchProfileSuggestions = async (query: string) => {

    const accessToken = await getAccessToken()

    axios.get(`${HOST_URL}/api/profile/search?query=${query}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
      .then(res => {
        setSearchResultUsers(res.data.users)
      })
      .catch(err => {
        console.log(err)
      })
  }

  useEffect(() => {
    if (username.length === 0) {
      setSearchResultUsers([])
    } else {
      searchProfileSuggestions(username)
    }
  }, [username])

  useEffect(() => {
    if (memberFid === 0) return
    handleAdd()
    setUsername('')
    setMemberFid(0)
  }, [memberFid])

  return (
    <div>
      <div className="flex flex-row items-start space-x-2 py-2 px-4 border-t dark:border-gray-800">
        <div className="min-w-0 flex-1">
          <div className="">
            <DebounceInput
              rows={2}
              debounceTimeout={300}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full resize-none border-0 border-b border-transparent p-0 pb-2 text-gray-900 placeholder:text-gray-400 sm:text-sm sm:leading-6 focus:outline-none dark:text-gray-100 dark:bg-gray-900"
              placeholder="Search for a user to add"
            />
          </div>
        </div>
        <div className="flex-shrink-0">
          <button
            disabled={username.length === 0}
            onClick={() => handleAdd()}
            className="flex items-center rounded-md bg-gray-900 w-20 h-9 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 disabled:bg-gray-700 disabled:hover:bg-gray-700"
          >
            {castSending
              ?
              <div role="status" className='flex flex-row justify-center mx-auto'>
                <svg aria-hidden="true" className="w-5 h-5 mx-auto text-gray-200 animate-spin fill-gray-900" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
              :
              <p className='mx-auto'>Add</p>
            }
          </button>
        </div>
      </div>
      <div>
        {searchResultUsers.map((user) => (
          <div
            onClick={() => setMemberFid(user.fid)}
            key={user.fid}
            className="flex flex-row items-center space-x-2 py-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-t dark:border-gray-800 hover:cursor-pointer"
          >
            <img src={user.pfp_url} className="inline-block h-8 w-8 rounded-full bg-gray-100"></img>
            <div className="min-w-0 flex-1 flex flex-row items-center">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mr-1">{user.display_name}</div>
              <div className="text-sm text-gray-500 truncate">@{user.username}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
