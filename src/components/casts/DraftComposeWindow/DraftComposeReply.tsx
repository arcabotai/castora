import { useCallback, useEffect, useRef, useState } from "react";
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";
import { usePrivy } from "@privy-io/react-auth";
import { Channel, UserMin } from "@/types";
import axios from "axios";
import { HOST_URL } from "@/utils/hostURL";
import PowerBadge from "@/components/PowerBadge";
import { stringByteLength, truncateLongWord } from "@/utils/textUtils";
import { useCurrentChannel } from "@/providers/CurrentChannelProvider";
import UploadButton from "../UploadButton";
import { isMobile } from "react-device-detect";
import EmojiPickerButton from "../EmojiPickerButton";
import PollButton from "../PollButton";
import GIPHYButton from "../GIPHYButton";
import CharacterCounter from "../CharacterCounter";
import { useQuery } from "react-query";
import Spinner from "@/components/Spinner";
import { CheckBadgeIcon, CheckCircleIcon, XCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { DRAFT_SEND_STATUS, Draft } from "@prisma/client";
import MentionAutocomplete from "../MentionAutocomplete";

import TextareaAutosize from 'react-textarea-autosize';
import URLPreviewCard from "../URLPreview";
import Recast from "../Recast";
import { getCastHashFromAppUrl } from "@/utils/castLinks";

interface DraftComposeReplyProps {
  parentDraftId: string;
  thisDraftId: string;
  currentAccount: UserMin;
  currentDraft: Draft;
  currentDraftReplies: Draft[];
  setCurrentDraftReplies: (drafts: Draft[]) => void;
  activeTextArea: HTMLTextAreaElement;
  editingDisabled: boolean;
  isAnon: boolean;
}

type DraftState = {
  text: string;
  embeds: any[];
}

export default function DraftComposeReply(props: DraftComposeReplyProps) {

  const {
    parentDraftId,
    thisDraftId,
    currentAccount,
    currentDraft,
    currentDraftReplies,
    setCurrentDraftReplies,
    activeTextArea,
    editingDisabled,
    isAnon,
  } = props;

  const { supercastUserState } = useSupercastUserState();
  const { getAccessToken } = usePrivy();

  const [uploadedCid, setCid] = useState("");
  const [filename, setFilename] = useState("");

  const [textareaElement, setTextareaElement] = useState<HTMLTextAreaElement>(null);
  const [autosaveInProgress, setAutosaveInProgress] = useState(false);

  const [mentionInput, setMentionInput] = useState('')
  const [mentionUsername, setMentionUsername] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)

  const [draftState, setDraftState] = useState<DraftState>({
    text: !!currentDraft ? currentDraft.text : '',
    embeds: !!currentDraft ? currentDraft.embeds : []
  });

  const [lastSnapshotDraftState, setLastSnapshotDraftState] = useState<DraftState>({
    text: '',
    embeds: []
  });

  const setDraftStateText = (text: string) => {
    setDraftState({ ...draftState, text });
  }

  const setDraftStateEmbeds = (embeds: any) => {
    setDraftState({ ...draftState, embeds });
  }

  const removeEmbed = (url: string) => {
    console.log(draftState.embeds)
    const newEmbeds = draftState.embeds.filter((embed) => embed.url !== url)
    setDraftStateEmbeds(newEmbeds)
  }

  const removeRecastEmbed = (hash: any) => {
    const newEmbeds = draftState.embeds.filter((embed) => embed.cast_id.hash !== hash)
    setDraftStateEmbeds(newEmbeds)
  }

  const textAreaRef = (node) => {
    setTextareaElement(node);
  }

  const handleCreateDraft = async () => {
    setAutosaveInProgress(true)
    const accessToken = await getAccessToken();

    const data = {
      text: draftState.text,
      embeds: draftState.embeds,
      parentDraftId: parentDraftId,
      isAnon: isAnon,
    }

    axios.post(`${HOST_URL}/api/drafts/`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    }).then((response) => {
      const dummyReply = {
        id: '',
        parentId: response.data.draft.id,
        text: '',
        embeds: [],
      }
      // take previous replies, update the last element with the response draft and add the dummy reply
      setCurrentDraftReplies([...currentDraftReplies.slice(0, currentDraftReplies.length - 1), response.data.draft, dummyReply])
    }).finally(() => {
      setAutosaveInProgress(false)
    })
  }

  const handleDeleteReply = async () => {
    const currentDraftRepliesSnapshot = [...currentDraftReplies]
    const currentReplyIndex = currentDraftReplies.findIndex((reply) => reply.id === thisDraftId)
    const nextReply = currentDraftReplies[currentReplyIndex + 1]
    const nextReplyUpdated = { ...nextReply, parentId: parentDraftId }
    const newDraftReplies = [...currentDraftReplies.slice(0, currentReplyIndex), nextReplyUpdated, ...currentDraftReplies.slice(currentReplyIndex + 2)]
    setCurrentDraftReplies(newDraftReplies)

    const accessToken = await getAccessToken();

    axios.delete(`${HOST_URL}/api/drafts/${thisDraftId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    }).then((response) => {
      // todo update reply util function
    }).catch((error) => {
      setCurrentDraftReplies(currentDraftRepliesSnapshot)
      console.log(error)
    })
  }

  const handleUpdateDraft = async () => {
    setAutosaveInProgress(true)
    const accessToken = await getAccessToken();

    const data = {
      text: draftState.text,
      embeds: draftState.embeds,
    }

    axios.put(`${HOST_URL}/api/drafts/${thisDraftId}`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid
      }
    }).then((response) => {
      // todo update reply util function
    }).finally(() => {
      setAutosaveInProgress(false)
    })
  }

  const handleNewCastText = (text: string) => {

    const mentionPattern = /@(\w+)(\/\S*)?$/
    const mentionMatch = text.slice(0, cursorPosition).match(mentionPattern)
    if (mentionMatch) {
      setMentionInput(mentionMatch[1])
    } else {
      setMentionInput('')
    }

    setDraftStateText(text)

    const urlPattern = /(https?:\/\/[\w.-]+\.[a-zA-Z]{2,}(\/\S*)?)$/
    const urlMatch = text.match(urlPattern)
    if (urlMatch) {
      // dont add embed if there is already 2
      if (draftState.embeds.length === 2) return

      // dont add embed if its already there
      const existingEmbeds = draftState.embeds.map((embed) => embed.url)
      if (existingEmbeds.includes(urlMatch[1])) return

      const appCastHash = getCastHashFromAppUrl(urlMatch[1])

      if (appCastHash) {
        // api call required to get the fid
        axios.get(`${HOST_URL}/api/cast/single?hash=${appCastHash}`).then(res => {
          setDraftState({
            text: text,
            embeds: [...draftState.embeds, { "cast_id": { hash: res.data.currentCast.hash, fid: res.data.currentCast.author.fid } }]
          });
        }).catch(err => {
          console.log(err)
        })
      } else {
        setDraftState({
          text: text,
          embeds: [...draftState.embeds, { "url": urlMatch[1] }]
        });
      }
    }

    setCursorPosition(textareaElement.selectionStart)
  }

  const handleSelectTextArea = (e) => {
    setCursorPosition(textareaElement.selectionStart)
  }

  const fetchAutocompleteSuggestion = async (mentionInput: string) => {

    const accessToken = await getAccessToken();

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
      const mentionPattern = /@(\w+)(\/\S*)?$/
      const mentionMatch = draftState.text.slice(0, cursorPosition).match(mentionPattern)
      if (mentionMatch) {
        const mentionIndex = draftState.text.lastIndexOf(mentionMatch[1])
        const newCastText = draftState.text.substring(0, mentionIndex) + mentionUsername + draftState.text.substring(cursorPosition)
        setDraftStateText(newCastText)
      }
      setMentionUsername('')
      setMentionInput('')
      textareaElement.focus()
      setTimeout(() => {
        textareaElement.setSelectionRange(cursorPosition + mentionUsername.length - 2, cursorPosition + mentionUsername.length - 2);
      }, 0);
    }

  }, [mentionUsername])

  // every 5 seconds, compare the current draft state with the last snapshot and save if different
  useEffect(() => {
    const interval = setInterval(() => {
      if (draftState.text !== lastSnapshotDraftState.text || JSON.stringify(draftState.embeds) !== JSON.stringify(lastSnapshotDraftState.embeds)) {
        if (thisDraftId) {
          handleUpdateDraft();
        } else {
          handleCreateDraft();
        }
        setLastSnapshotDraftState(draftState);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [draftState, lastSnapshotDraftState]);

  useEffect(() => {
    // every time this draftId changes, update the last snapshot and draft state
    setDraftState({
      text: !!currentDraft ? currentDraft.text : '',
      embeds: !!currentDraft ? currentDraft.embeds : []
    });
    setLastSnapshotDraftState({
      text: !!currentDraft ? currentDraft.text : '',
      embeds: !!currentDraft ? currentDraft.embeds : []
    });
  }, [thisDraftId]);

  return (
    <div
      className={`${(editingDisabled && !thisDraftId) && 'hidden'}`}
      onClick={() => {
        if (textareaElement !== activeTextArea) {
          textareaElement.focus()
        }
      }}>
      <div className="flex items-start gap-x-4 h-full">
        <div className={`flex-shrink-0 flex flex-col justify-between items-center w-12 h-full`}>
          <img
            className="inline-block h-10 w-10 object-cover rounded-full shrink-0"
            src={isAnon ? '/superanon.png' : currentAccount.avatar}
            alt=""
          />
          {(thisDraftId && !(currentDraftReplies.indexOf(currentDraft) === currentDraftReplies.length - 2 && editingDisabled)) &&
            <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-800"></div>
          }
        </div>
        <div className="flex flex-col gap-y-1 flex-grow">
          <div className="">
            <label className="sr-only">
              Add a reply
            </label>
            <TextareaAutosize
              id={`draft-${thisDraftId ? thisDraftId : 'new'}`}
              onChange={(e) => handleNewCastText(e.target.value)}
              value={draftState.text}
              className="block w-full resize-none border-0 bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 sm:text-sm sm:leading-6 focus:outline-none disabled:opacity-50"
              placeholder="Add a reply"
              ref={textAreaRef}
              onSelect={(e) => handleSelectTextArea(e)}
              disabled={editingDisabled || !parentDraftId}
            />
            <div className='absolute z-30 left-18'>
              <MentionAutocomplete autocompleteSuggestions={autocompleteSuggestionQuery.data ? autocompleteSuggestionQuery.data.users : []} setMentionUsername={setMentionUsername} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between py-2 pr-2 gap-y-1">
            <div className='flex flex-col gap-y-1'>
              <div className="flex flex-col gap-y-1 sm:h-8">
                {(textareaElement && (activeTextArea === textareaElement) && !editingDisabled) &&
                  <div className='flex flex-row gap-x-1'>
                    <UploadButton currentDraft={currentDraft} uploadedCid={uploadedCid} setCid={setCid} filename={filename} setFilename={setFilename} castEmbeds={draftState.embeds} setCastEmbeds={setDraftStateEmbeds} textAreaElement={textareaElement} />
                    {/* <PollButton currentDraft={currentDraft} castEmbeds={draftState.embeds} setCastEmbeds={setDraftStateEmbeds} castText={draftState.text} setCastText={setDraftStateText} /> */}
                    <GIPHYButton currentDraft={currentDraft} castEmbeds={draftState.embeds} setCastEmbeds={setDraftStateEmbeds} />
                    {!isMobile && <EmojiPickerButton currentDraft={currentDraft} castText={draftState.text} setCastText={setDraftStateText} textareaElement={textareaElement} cursorPosition={cursorPosition} />}
                    <CharacterCounter castLength={stringByteLength(draftState.text)} />
                  </div>
                }
              </div>
            </div>
            <div className='flex flex-row-reverse justify-end sm:flex-row sm:justify-normal items-center gap-x-2'>
              {(!!thisDraftId && !editingDisabled) &&
                <button
                  onClick={handleDeleteReply}
                  className=''
                >
                  <XCircleIcon className='w-4 h-4 text-red-500 hover:text-red-400' />
                </button>
              }
              <div className="w-4 flex justify-center">
                {autosaveInProgress
                  ?
                  <div className='flex items-center'>
                    <div className='w-2 h-2 bg-yellow-400 rounded-full animate-pulse'></div>
                  </div>
                  :
                  draftState.text === lastSnapshotDraftState.text && draftState.embeds === lastSnapshotDraftState.embeds
                  &&
                  <CheckCircleIcon className='w-4 h-4 text-green-500' />
                }
              </div>
            </div>
          </div>
          <div className='flex flex-col gap-y-2'>
            {draftState.embeds.map((embed, index) => (
              !!embed.url &&
              <div
                key={embed.url + index}
                className='relative'>
                <button
                  onClick={() => removeEmbed(embed.url)}
                  className='absolute right-1 top-1 p-0.5 bg-white hover:bg-gray-100 flex justify-center items-center rounded-full border border-gray-400'
                >
                  <XMarkIcon className="h-4 w-4 text-gray-400" />
                </button>
                <URLPreviewCard key={embed.url} url={embed.url} small={true} castHash={''} />
              </div>
            ))}
            {draftState.embeds.map((embed, index) => (
              !!embed.cast_id &&
              <div
                key={embed.cast_id + index}
                className='relative'>
                <button
                  onClick={() => removeRecastEmbed(embed.cast_id.hash)}
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
    </div>
  );
}
