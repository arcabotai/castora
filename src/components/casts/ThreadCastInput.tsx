import React, { useEffect, useState, Dispatch, SetStateAction } from 'react';
import MentionAutocomplete from './MentionAutocomplete';
import UploadButton from './UploadButton';
import CharacterCounter from './CharacterCounter';
import { MinusCircleIcon, PlusCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import URLPreviewCard from './URLPreview';
import { stringByteLength } from '@/utils/textUtils';
import axios from 'axios';
import { HOST_URL } from '@/utils/hostURL';
import EmojiPickerButton from './EmojiPickerButton';
import Recast from './Recast';
import { useQuery } from 'react-query';
import GIPHYButton from './GIPHYButton';
import { usePrivy } from '@privy-io/react-auth';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';

type ThreadCast = {
  position: number
  castText: string
  castEmbeds: string[]
}

interface ThreadCastProps {
  position: number
  threadCasts: ThreadCast[]
  setThreadCasts: Dispatch<SetStateAction<ThreadCast[]>>
}

const ThreadCastInput: React.FC<ThreadCastProps> = ({ position, threadCasts, setThreadCasts }) => {

  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()

  const [castText, setCastText] = useState('')
  const [castSending, setCastSending] = useState(false)
  const [castEmbeds, setCastEmbeds] = useState([])
  const [mentionInput, setMentionInput] = useState('')
  const [mentionUsername, setMentionUsername] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)

  const [datePicked, setDatePicked] = useState(false)
  const [scheduleDate, setScheduleDate] = useState(new Date());

  const [uploadedCid, setCid] = useState("");
  const [filename, setFilename] = useState("");
  const [textareaElement, setTextareaElement] = useState(null);
  const [textAreaFocused, setTextAreaFocused] = useState(false);

  const textAreaRef = (node) => {
    setTextareaElement(node);
    if (node && !textAreaFocused) {
      node.focus()
      setTextAreaFocused(true)
    }
  }

  const handleNewCastText = (text: string) => {

    // if the user press enter on the last cast of the thread, add a new thread cast, 
    if (text.slice(-3) === '\n\n\n' && threadCasts.length === position + 1) {
      setThreadCasts(
        (prev) => [...prev, { position: prev.length, castText: '', castEmbeds: [] }]
      )
      setCastText(text.slice(0, -3))
      // TODO test if this doesnt cause problems with embeds etc
      return
    }

    const mentionPattern = /@(\w+)(\/\S*)?$/
    const mentionMatch = text.match(mentionPattern)
    if (mentionMatch) {
      setMentionInput(mentionMatch[1])
    } else {
      setMentionInput('')
    }
    setCastText(text)

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

  const addNewThreadCast = () => {
    setThreadCasts(
      (prev) => [...prev, { position: prev.length, castText: `thread reply ${prev.length}`, castEmbeds: [] }]
    )
  }

  const removeThisThreadCast = () => {

    const newThread = threadCasts.filter((cast) => cast.position !== position)

    // update thread casts position
    const newThreadCasts = newThread.map((cast, index) => {
      cast.position = index
      return cast
    })

    setThreadCasts(newThreadCasts)
  }

  useEffect(() => {

    // update cast text in the cast on the current position
    const newThreadCasts = [...threadCasts]
    newThreadCasts[position].castText = castText
    setThreadCasts(newThreadCasts)
  }, [castText])

  useEffect(() => {
    // update cast embeds in the cast on the current position
    const newThreadCasts = [...threadCasts]
    newThreadCasts[position].castEmbeds = castEmbeds
    setThreadCasts(newThreadCasts)
  }, [castEmbeds])

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
    <div className="flex items-start space-x-4 pt-4">
      <div className={`flex-shrink-0 flex flex-col items-center ${threadCasts.length != position + 1 && 'h-[200px]'}`}>
        <img
          className="inline-block h-10 w-10 object-cover rounded-full"
          src={supercastUserState.accounts.find((account) => account.fid === supercastUserState.currentFid)?.avatar}
          alt=""
        />
        <div className='flex-grow w-0.5 bg-gray-200 dark:bg-gray-700 mt-1 -mb-10'></div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="overflow-hidden">
          <label className="sr-only">
            Add another cast
          </label>
          <textarea
            rows={7}
            onChange={(e) => handleNewCastText(e.target.value)}
            value={castText}
            className="block w-full resize-none border-0 bg-transparent py-1.5 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 sm:text-sm sm:leading-6 focus:outline-none"
            placeholder="Create your cast"
            ref={textAreaRef}
            onSelect={(e) => handleSelectTextArea(e)}
          />
          <div className='absolute z-30 left-18'>
            <MentionAutocomplete autocompleteSuggestions={autocompleteSuggestionQuery.data ? autocompleteSuggestionQuery.data.users : []} setMentionUsername={setMentionUsername} />
          </div>
        </div>

        <div className="flex justify-between py-2 pr-2 space-x-5">
          <div className='flex flex-col gap-y-2'>
            {!!textareaElement &&
              <div className='flex flex-row gap-x-1'>
                <UploadButton uploadedCid={uploadedCid} setCid={setCid} filename={filename} setFilename={setFilename} castEmbeds={castEmbeds} setCastEmbeds={setCastEmbeds} textAreaElement={textareaElement} />
                <EmojiPickerButton castText={castText} setCastText={setCastText} textareaElement={textareaElement} cursorPosition={cursorPosition} />
                <GIPHYButton castEmbeds={castEmbeds} setCastEmbeds={setCastEmbeds} />
              </div>
            }
          </div>
          <div className='flex flex-col items-start justify-between'>
            <div className='flex flex-col-reverse items-end gap-y-2 lg:items-center lg:flex-row lg:gap-x-3 lg:gap-y-0'>
              <CharacterCounter castLength={stringByteLength(castText)} />
              <button
                onClick={() => removeThisThreadCast()}
                className={`text-gray-400 hover:text-gray-600`}
              >
                <MinusCircleIcon className="h-6 w-6" />
              </button>
              <button
                onClick={() => addNewThreadCast()}
                className={`text-gray-400 hover:text-gray-600 ${threadCasts.length != position + 1 && 'hidden'}`}
              >
                <PlusCircleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
        {/* move to cast embeds */}
        <div className='flex flex-col gap-y-2'>
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
    </div>
  );
};

export default ThreadCastInput;
