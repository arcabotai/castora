'use client'

import { useEffect, useState, useRef } from 'react'

import { XMarkIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { toast } from 'sonner'
import { HOST_URL } from '@/utils/hostURL'
import MentionAutocomplete from '../casts/MentionAutocomplete'
import UploadButton from '../casts/UploadButton'
import { stringByteLength } from '@/utils/textUtils'
import CharacterCounter from '../casts/CharacterCounter'
import URLPreviewCard from '../casts/URLPreview'
import Image from 'next/image'
import EmojiPickerButton from '../casts/EmojiPickerButton'
import Recast from '../casts/Recast'
import { useQuery } from 'react-query'
import GIPHYButton from '../casts/GIPHYButton'
import DegenButton from '../casts/DegenButton'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import { useOpenSignerApproval } from '@/providers/OpenSignerApprovalProvider'
import { isMobile } from 'react-device-detect'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Skeleton } from '../ui/skeleton'

export default function DraftPreviewReplyTextArea({ parentDraftId, replies, setReplies, login }: { parentDraftId: string, replies: any, setReplies: any, login: any }) {

  const [castText, setCastText] = useState('')
  const [castSending, setCastSending] = useState(false)
  const [isCMDPressed, setIsCMDPressed] = useState(false)
  const [mentionInput, setMentionInput] = useState('')
  const [mentionUsername, setMentionUsername] = useState('')
  const [rowsCount, setRowsCount] = useState(2);
  const [cursorPosition, setCursorPosition] = useState(0);

  const [castEmbeds, setCastEmbeds] = useState([])
  const [uploadedCid, setCid] = useState("");
  const [filename, setFilename] = useState("");
  const [textareaElement, setTextareaElement] = useState(null);
  const [textAreaFocused, setTextAreaFocused] = useState(false);

  const { setOpenSignerApproval } = useOpenSignerApproval()
  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()

  const textAreaRef = (node) => {
    setTextareaElement(node);
    if (node && !textAreaFocused) {
      node.focus()
      setTextAreaFocused(true)
    }
  }

  const handleScheduleReply = async () => {
    setCastSending(true)

    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/drafts/${parentDraftId}/schedule-reply`, {
      "text": castText
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
      .then(res => {
        setReplies([
          {
            ...res.data.reaction,
            author: {
              fid: supercastUserState.currentFid,
              username: supercastUserState.accounts.find((account) => account.fid === supercastUserState.currentFid)?.username,
              display_name: supercastUserState.accounts.find((account) => account.fid === supercastUserState.currentFid)?.displayName,
              pfp_url: supercastUserState.accounts.find((account) => account.fid === supercastUserState.currentFid)?.avatar,
            }
          }, ...replies])
        toast.success('Reply sent')
        setCastText('')
        setCid('')
        setFilename('')
        setRowsCount(2)
        setCastEmbeds([])
      })
      .catch(err => {
        if (err.response.data.error === "NO_SIGNER_APPROVED") {
          setOpenSignerApproval(true)
        } else {
          toast.error('Error replying')
        }
      })
      .finally(() => {
        setCastSending(false)
      })
  }

  const handleNewCastText = (text: string) => {
    const mentionPattern = /@(\w+)(\/\S*)?$/
    const mentionMatch = text.match(mentionPattern)
    if (mentionMatch) {
      setMentionInput(mentionMatch[1])
    } else {
      setMentionInput('')
    }

    const urlPattern = /(https?:\/\/[\w.-]+\.[a-zA-Z]{2,}(\/\S*)?)$/
    const urlMatch = text.match(urlPattern)
    if (urlMatch) {
      // dont add embed if there is already 2
      if (castEmbeds.length === 2) return

      // dont add embed if its already there
      const existingEmbeds = castEmbeds.map((embed) => embed.url)
      if (existingEmbeds.includes(urlMatch[1])) return

      const supercastPattern = /https?:\/\/(www\.)?super\.sc\/c\/(0x[0-9a-fA-F]+)/;
      const supercastMatches = urlMatch[1].match(supercastPattern);

      if (supercastMatches) {
        // api call required to get the fid
        axios.get(`${HOST_URL}/api/cast/single?hash=${supercastMatches[2]}`).then(res => {
          setCastEmbeds(
            (prev) => [...prev, { "cast_id": { hash: res.data.currentCast.hash, fid: res.data.currentCast.author.fid } }]
          )
        }).catch(err => {
          console.log(err)
        })
      } else {
        setCastEmbeds(
          (prev) => [...prev, { "url": urlMatch[1] }]
        )
      }
    }

    setCastText(text)

    // TODO optimize, for now it gets the job done
    if (text.length > 180 || (text.match(/\n/g) || []).length > 4) {
      setRowsCount(10)
    } else if (text.length > 40 || text.includes("\n")) {
      setRowsCount(5)
    } else {
      setRowsCount(2)
    }
    setCursorPosition(textareaElement.selectionStart)
  }

  const handleSelectTextArea = (e) => {
    setCursorPosition(textareaElement.selectionStart)
  }

  const handleCMDDown = (event) => {

    // only trigger if the textarea is focused
    if (!textareaElement || document.activeElement !== textareaElement) return

    if (event.key === 'Meta') {
      setIsCMDPressed(true)
    }

    if (event.metaKey && event.key === 'Enter') {
      event.preventDefault()
      handleScheduleReply()
    }
  }

  const handleCMDUp = (event) => {
    if (event.key === 'Meta') {
      setIsCMDPressed(false)
    }
  }

  const removeEmbed = (url: string) => {
    setCastEmbeds(
      castEmbeds.filter((embed) => embed.url !== url)
    )
  }

  const loginIfLoggedOut = async () => {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      login()
    }
  }

  useEffect(() => {

    // Add an event listener to the document to capture keydown events
    document.addEventListener('keydown', handleCMDDown);
    document.addEventListener('keyup', handleCMDUp);

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener('keydown', handleCMDDown);
      document.removeEventListener('keyup', handleCMDUp);
    };
  }, [castText]);

  const fetchAutocompleteSuggestion = async (mentionInput: string) => {
    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/profile/search?query=${mentionInput}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
    return response.data;
  };

  const autocompleteSuggestionQuery = useQuery(
    ['autocompleteSuggestion', mentionInput],
    () => fetchAutocompleteSuggestion(mentionInput),
    {
      enabled: mentionInput.length > 0,
    }
  );

  useEffect(() => {
    // if mentionUsername is not empty, replace the mention input with it
    if (mentionUsername.length > 0) {
      const mentionPattern = /(?<!\w)@(\w*)$/
      const mentionMatch = castText.match(mentionPattern)
      if (mentionMatch) {
        const mentionIndex = castText.lastIndexOf(mentionMatch[1])
        const newCastText = castText.substring(0, mentionIndex) + mentionUsername + ' '
        setCastText(newCastText)
      }
      setMentionUsername('')
      setMentionInput('')
      textareaElement.focus()
    }

  }, [mentionUsername])

  return (
    <div
      className='py-2 px-4 border-t dark:border-gray-800 flex flex-col gap-y-2'
      onClick={loginIfLoggedOut}
    >
      <div className="flex flex-row items-start space-x-2 ">
        <div className="flex-shrink-0">
          {!!supercastUserState.currentFid ?
            <Avatar className='h-10 w-10'>
              <AvatarImage
                src={supercastUserState.accounts.find((account) => account.fid === supercastUserState.currentFid)?.avatar}
                alt='Profile picture'
              />
              <AvatarFallback>
                <Skeleton
                  className="h-10 w-10"
                />
              </AvatarFallback>
            </Avatar>
            :
            <div className='w-10 h-10'></div>
          }
        </div>
        <div className="min-w-0 flex-1">
          <div className="">
            <label htmlFor="comment" className="sr-only">
              Cast your reply
            </label>
            <textarea
              rows={rowsCount}
              value={castText}
              onChange={(e) => handleNewCastText(e.target.value)}
              className="block w-full resize-none border-0 border-b border-transparent p-0 pb-2 text-gray-900 dark:text-gray-100 dark:bg-gray-900 placeholder:text-gray-400 sm:text-sm sm:leading-6 focus:outline-none"
              placeholder="Cast your reply"
              ref={textAreaRef}
              onSelect={handleSelectTextArea}
            />
          </div>
          {(!!textareaElement && !!supercastUserState.currentFid) &&
            <div className='flex flex-row gap-x-1'>
              <UploadButton uploadedCid={uploadedCid} setCid={setCid} filename={filename} setFilename={setFilename} castEmbeds={castEmbeds} setCastEmbeds={setCastEmbeds} textAreaElement={textareaElement} />
              {!isMobile && <EmojiPickerButton castText={castText} setCastText={setCastText} textareaElement={textareaElement} cursorPosition={cursorPosition} />}
              <GIPHYButton castEmbeds={castEmbeds} setCastEmbeds={setCastEmbeds} small={true} />
              <DegenButton castText={castText} setCastText={setCastText} textareaElement={textareaElement} cursorPosition={cursorPosition} />
            </div>
          }
        </div>
        <div className='absolute mt-16 left-10'>
          <MentionAutocomplete autocompleteSuggestions={autocompleteSuggestionQuery.data ? autocompleteSuggestionQuery.data.users : []} setMentionUsername={setMentionUsername} />
        </div>
        <div className="flex-shrink-0 flex flex-col items-center">
          <button
            disabled={(castText.length === 0 && castEmbeds.length === 0) || stringByteLength(castText) > 1024}
            onClick={() => handleScheduleReply()}
            className={`flex items-center rounded-md bg-gray-900 w-20 h-9 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 disabled:bg-gray-700 disabled:hover:bg-gray-700 ${isCMDPressed && 'bg-gray-700'}`}
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
              <p className='mx-auto'>Reply</p>
            }
          </button>
          <div className='mt-2'>
            <CharacterCounter castLength={stringByteLength(castText)} />
          </div>
        </div>
      </div>
      <div className='flex flex-col gap-y-2 pl-12'>
        {castEmbeds.map((embed) => (
          !!embed.url &&
          <div className='relative'>
            <button
              onClick={() => removeEmbed(embed.url)}
              className='absolute right-1 top-1 p-0.5 bg-white hover:bg-gray-100 flex justify-center items-center rounded-full border border-gray-400'
            >
              <XMarkIcon className="h-4 w-4 text-gray-400" />
            </button>
            <URLPreviewCard key={embed.url} url={embed.url} small={true} castHash={''} />
          </div>
        ))}
        {castEmbeds.map((embed) => (
          !!embed.cast_id &&
          <div className='relative'>
            <button
              onClick={() => removeEmbed(embed.url)}
              className='absolute right-1 top-1 p-0.5 bg-white hover:bg-gray-100 flex justify-center items-center rounded-full border border-gray-400'
            >
              <XMarkIcon className="h-4 w-4 text-gray-400" />
            </button>
            <Recast hash={embed.cast_id.hash} />
          </div>
        ))}
      </div>
    </div>
  )
}
