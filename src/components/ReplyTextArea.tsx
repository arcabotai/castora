'use client'

import { useEffect, useState, useRef, KeyboardEvent } from 'react'

import { XMarkIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { toast } from 'sonner'
import { HOST_URL } from '@/utils/hostURL'
import MentionAutocomplete from './casts/MentionAutocomplete'
import UploadButton from './casts/UploadButton'
import { stringByteLength } from '@/utils/textUtils'
import CharacterCounter from './casts/CharacterCounter'
import URLPreviewCard from './casts/URLPreview'
import Image from 'next/image'
import EmojiPickerButton from './casts/EmojiPickerButton'
import Recast from './casts/Recast'
import { useQuery } from 'react-query'
import GIPHYButton from './casts/GIPHYButton'
import DegenButton from './casts/DegenButton'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import { useOpenSignerApproval } from '@/providers/OpenSignerApprovalProvider'
import TextareaAutosize from 'react-textarea-autosize';
import { isMobile } from 'react-device-detect'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Skeleton } from './ui/skeleton'
import AnonButtonReply from './casts/AnonButtonReply'
import { Loader2, SendIcon } from 'lucide-react'
import { Button } from './ui/button'
import { useHotkeys } from 'react-hotkeys-hook'
import { getCastHashFromAppUrl } from '@/utils/castLinks'

export default function ReplyTextArea({ parentHash, replies, setReplies }: { parentHash: string, replies: any, setReplies: any }) {

  const [castText, setCastText] = useState('')
  const [castSending, setCastSending] = useState(false)
  const [isCMDPressed, setIsCMDPressed] = useState(false)
  const [mentionInput, setMentionInput] = useState('')
  const [mentionUsername, setMentionUsername] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0);

  const [castEmbeds, setCastEmbeds] = useState([])
  const [uploadedCid, setCid] = useState("");
  const [filename, setFilename] = useState("");
  const [textareaElement, setTextareaElement] = useState(null);
  const [textAreaFocused, setTextAreaFocused] = useState(false);

  const { setOpenSignerApproval } = useOpenSignerApproval()
  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()

  const [isAnon, setIsAnon] = useState(false)
  const ANON_MODE_ENABLED = process.env.NEXT_PUBLIC_ANON_MODE_ENABLED === 'true';

  const textAreaRef = (node) => {
    setTextareaElement(node);
  }

  useHotkeys('r', () => textareaElement.focus(), { preventDefault: true }, [textareaElement])

  const handleSendReply = async () => {
    setCastSending(true)

    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/cast`, { "text": castText, "parentHash": parentHash, "embeds": castEmbeds, "isAnon": isAnon }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
      .then(res => {
        setReplies([[res.data.cast], ...replies])
        toast.success('Reply sent')
        setCastText('')
        setCid('')
        setFilename('')
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

      const appCastHash = getCastHashFromAppUrl(urlMatch[1])

      if (appCastHash) {
        // api call required to get the fid
        axios.get(`${HOST_URL}/api/cast/single?hash=${appCastHash}`).then(res => {
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

    setCursorPosition(textareaElement.selectionStart)
  }

  const handleSelectTextArea = (e) => {
    setCursorPosition(textareaElement.selectionStart)
  }

  const removeEmbed = (url: string) => {
    setCastEmbeds(
      castEmbeds.filter((embed) => embed.url !== url)
    )
  }

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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (castText.length > 0 || castEmbeds.length > 0) {
        handleSendReply();
      }
    }
  };

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
    <div className='py-2 px-4 border-t dark:border-gray-800 flex flex-col gap-y-2'>
      <div className="flex flex-row items-start space-x-2 ">
        <div className="flex-shrink-0">
          <Avatar className='h-12 w-12'>
            <AvatarImage
              src={isAnon ? '/superanon.png' : supercastUserState.accounts.find((account) => account.fid === supercastUserState.currentFid)?.avatar}
              alt='Profile picture'
            />
            <AvatarFallback>
              <Skeleton
                className="h-12 w-12"
              />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className='w-full flex flex-col gap-y-2'>
          <div className="min-w-0 flex-1">
            <div className="">
              <label htmlFor="comment" className="sr-only">
                Cast your reply
              </label>
              <TextareaAutosize
                value={castText}
                onChange={(e) => handleNewCastText(e.target.value)}
                className="block w-full resize-none border-0 border-b border-transparent p-0 pb-2 text-gray-900 dark:text-gray-100 dark:bg-gray-900 placeholder:text-gray-400 sm:text-sm sm:leading-6 focus:outline-none min-h-[60px]"
                placeholder="Cast your reply"
                ref={textAreaRef}
                onSelect={handleSelectTextArea}
                onKeyDown={handleKeyDown}
              />
            </div>
            {!!textareaElement &&
              <div className='flex flex-row gap-x-1 items-center'>
                <UploadButton uploadedCid={uploadedCid} setCid={setCid} filename={filename} setFilename={setFilename} castEmbeds={castEmbeds} setCastEmbeds={setCastEmbeds} textAreaElement={textareaElement} />
                {!isMobile && <EmojiPickerButton castText={castText} setCastText={setCastText} textareaElement={textareaElement} cursorPosition={cursorPosition} />}
                <GIPHYButton castEmbeds={castEmbeds} setCastEmbeds={setCastEmbeds} small={true} />
                <DegenButton castText={castText} setCastText={setCastText} textareaElement={textareaElement} cursorPosition={cursorPosition} />
                {ANON_MODE_ENABLED && <AnonButtonReply isAnon={isAnon} setIsAnon={setIsAnon} />}
                <CharacterCounter castLength={stringByteLength(castText)} />
              </div>
            }
          </div>
          <div className="flex-shrink-0 flex flex-col items-center">
            <Button
              disabled={(castText.length === 0 && castEmbeds.length === 0) || stringByteLength(castText) > 1024}
              onClick={() => handleSendReply()}
              className='w-full h-7 flex flex-row gap-x-2'
            >
              {castSending
                ?
                <Loader2 className='w-4 h-4 animate-spin' />
                :
                <SendIcon className='w-4 h-4' />
              }
              <p className=''>Reply</p>
            </Button>
          </div>
        </div>
        <div className='absolute mt-16 left-10'>
          <MentionAutocomplete autocompleteSuggestions={autocompleteSuggestionQuery.data ? autocompleteSuggestionQuery.data.users : []} setMentionUsername={setMentionUsername} />
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
