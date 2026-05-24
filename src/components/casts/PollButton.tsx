import React, { useState } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'sonner';
import { HOST_URL } from '@/utils/hostURL';
import { isMobile } from 'react-device-detect';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import { usePrivy } from '@privy-io/react-auth';
import { DRAFT_SEND_STATUS, Draft } from '@prisma/client';
import { Button } from '../ui/button';


// TODO type fix any
interface Props {
  currentDraft?: Draft;
  setCastEmbeds: React.Dispatch<React.SetStateAction<any[]>>
  castText: string
  setCastText: React.Dispatch<React.SetStateAction<string>>
  castEmbeds: any[]
  small?: boolean
}

export default function PollButton({ currentDraft, setCastEmbeds, castEmbeds, castText, setCastText, small }: Props) {

  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()

  const [openPollCreator, setOpenPollCreator] = useState(false)

  const [question, setQuestion] = useState('')
  const [answer1, setAnswer1] = useState('')
  const [answer2, setAnswer2] = useState('')
  const [answer3, setAnswer3] = useState('')
  const [answer4, setAnswer4] = useState('')
  const [loadingCreatePoll, setLoadingCreatePoll] = useState(false)

  const createPoll = async () => {
    setLoadingCreatePoll(true)

    const accessToken = await getAccessToken()

    // TODO add validation, question and answer1 are required
    const pollData = {
      question: question,
      username: supercastUserState.accounts.find((account) => account.fid === supercastUserState.currentFid)?.username,
      answer1,
      answer2,
      answer3,
      answer4
    }
    axios.post(`${HOST_URL}/api/polls`, pollData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
      .then((res) => {
        toast.success('Poll created!')
        setOpenPollCreator(false)
        setCastEmbeds([...castEmbeds, { "url": `${HOST_URL}/polls/${res.data.poll.id}` }])

        if (castText === '') {
          setCastText(`${HOST_URL}/polls/${res.data.poll.id}`)
        } else {
          setCastText(castText + `\n\n${HOST_URL}/polls/${res.data.poll.id}`)
        }
        setQuestion('')
        setAnswer1('')
        setAnswer2('')
        setAnswer3('')
        setAnswer4('')
      })
      .catch((err) => {
        toast.error('Failed to create poll')
        console.log(err)
      })
      .finally(() => {
        setLoadingCreatePoll(false)
      })
  }


  return (
    <div className="flex items-center gap-x-2 relative">
      <Button
        onClick={() => setOpenPollCreator(!openPollCreator)}
        disabled={castEmbeds.length >= 2 || (!!currentDraft && (currentDraft.sendStatus === DRAFT_SEND_STATUS.SENT || currentDraft.sendStatus === DRAFT_SEND_STATUS.SCHEDULED))}
        className="flex flex-row items-center justify-center py-0"
        variant='outline'
        size='sm'
      >
        <ChartBarIcon className='w-5 h-5 text-gray-500 rotate-90' />
      </Button>
      {openPollCreator && (
        <div className={`absolute z-50 top-8 ${small && '-left-[100px]'} ${isMobile && '-left-[60px]'}`}>
          <div className='px-4 py-2 flex flex-col gap-y-3 bg-white w-72 sm:w-96 dark:bg-gray-800 dark:text-gray-100 border dark:border-gray-700 rounded-md'>
            <div className='text-sm text-gray-900'>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-200 mb-0.5'>
                Question
              </label>
              <input
                type="text"
                className="w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700 focus:border-transparent"
                placeholder="Ask a question"
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>
            <div className='text-sm text-gray-900'>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-200 mb-0.5'>
                Answer 1
              </label>
              <input
                type="text"
                className="w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700 focus:border-transparent"
                placeholder="Max 13 characters"
                maxLength={13}
                onChange={(e) => setAnswer1(e.target.value)}
              />
            </div>
            <div className='text-sm text-gray-900'>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-200 mb-0.5'>
                Answer 2
              </label>
              <input
                type="text"
                className="w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700 focus:border-transparent"
                placeholder="Max 13 characters (optional)"
                maxLength={13}
                onChange={(e) => setAnswer2(e.target.value)}
              />
            </div>
            <div className='text-sm text-gray-900'>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-200 mb-0.5'>
                Answer 3
              </label>
              <input
                type="text"
                className="w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700 focus:border-transparent"
                placeholder="Max 13 characters (optional)"
                maxLength={13}
                onChange={(e) => setAnswer3(e.target.value)}
              />
            </div>
            <div className='text-sm text-gray-900'>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-200 mb-0.5'>
                Answer 4
              </label>
              <input
                type="text"
                className="w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700 focus:border-transparent"
                placeholder="Max 13 characters (optional)"
                maxLength={13}
                onChange={(e) => setAnswer4(e.target.value)}
              />
            </div>
            <div className='pt-2'>
              <button
                type="button"
                className="w-full rounded-md bg-black hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-2 text-sm text-white"
                onClick={createPoll}
              >
                {loadingCreatePoll && (
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                )
                }
                Create poll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
