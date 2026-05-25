import { useCallback, useEffect, useRef, useState } from "react";
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";
import { useDraftComposeWindow } from "@/providers/DraftComposeWindowProvider";
import { Dialog, DialogContent } from "@/components/ui/window";
import defaultStyle from "./defaultStyle";
import mentionStyle from "./mentionStyle";
import { usePrivy } from "@privy-io/react-auth";
import { Channel, UserMin } from "@/types";
import axios from "axios";
import { HOST_URL } from "@/utils/hostURL";
import PowerBadge from "@/components/PowerBadge";
import { stringByteLength, truncateLongWord } from "@/utils/textUtils";
import { useCurrentChannel } from "@/providers/CurrentChannelProvider";
import ChannelPickerButton from "../ChannelPickerButton";
import UploadButton from "../UploadButton";
import { isMobile } from "react-device-detect";
import EmojiPickerButton from "../EmojiPickerButton";
import PollButton from "../PollButton";
import GIPHYButton from "../GIPHYButton";
import { ScheduleDatePicker } from "../ScheduleDatePicker";
import CharacterCounter from "../CharacterCounter";
import { debounce } from "lodash";
import { useQuery } from "react-query";
import Spinner from "@/components/Spinner";
import { toast } from "sonner";
import { CheckBadgeIcon, CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { DRAFT_SEND_STATUS, Draft } from "@prisma/client";
import MentionAutocomplete from "../MentionAutocomplete";

import TextareaAutosize from 'react-textarea-autosize';
import URLPreviewCard from "../URLPreview";
import Recast from "../Recast";
import { ScheduleButton } from "./ScheduleButton";
import AnonButton from "../AnonButton";
import CastoraBadge from "@/components/CastoraBadge";
import { useSupercastMember } from "@/providers/SupercastMemberProvider";
import { getCastHashFromAppUrl } from "@/utils/castLinks";

interface DraftComposeUnitProps {
  draftId: string;
  setDraftId: (draftId: string) => void;
  prevDraftId: string;
  currentDraft: Draft;
  setCurrentDraft: (draft: Draft) => void;
  currentDraftReplies: Draft[];
  setCurrentDraftReplies: (drafts: Draft[]) => void;
  currentAccount: UserMin;
  addNewDraftToColumn: (newDraft: any) => void;
  updateExistingDraftInColumn: (updatedDraft: any) => void;
  activeTextArea: HTMLTextAreaElement;
  editingDisabled: boolean;
  datePicked: boolean;
  setDatePicked: (datePicked: boolean) => void;
  scheduleDate: Date;
  setScheduleDate: (scheduleDate: Date) => void;
}

type DraftState = {
  text: string;
  embeds: any[];
}

export default function DraftComposeUnit(props: DraftComposeUnitProps) {

  const {
    currentAccount,
    draftId,
    setDraftId,
    prevDraftId,
    currentDraft,
    setCurrentDraft,
    currentDraftReplies,
    setCurrentDraftReplies,
    addNewDraftToColumn,
    updateExistingDraftInColumn,
    activeTextArea,
    editingDisabled,
    datePicked,
    setDatePicked,
    scheduleDate,
    setScheduleDate
  } = props;

  const { supercastUserState } = useSupercastUserState();
  const { currentChannel, setCurrentChannel } = useCurrentChannel()
  const {
    openDraftComposeWindow,
    setOpenDraftComposeWindow,
    initialText,
    initialEmbeds,
    initialRecastId
  } = useDraftComposeWindow();
  const { getAccessToken } = usePrivy();

  const [uploadedCid, setCid] = useState("");
  const [filename, setFilename] = useState("");

  const [textareaElement, setTextareaElement] = useState<HTMLTextAreaElement>(null);
  const [autosaveInProgress, setAutosaveInProgress] = useState(false);

  const [mentionInput, setMentionInput] = useState('')
  const [mentionUsername, setMentionUsername] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [textAreaFocused, setTextAreaFocused] = useState(false);

  const { isSupercastMember } = useSupercastMember();

  const ANON_MODE_ENABLED = process.env.NEXT_PUBLIC_ANON_MODE_ENABLED === 'true';

  const [draftState, setDraftState] = useState<DraftState>({
    text: '',
    embeds: []
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
    const newEmbeds = draftState.embeds.filter((embed) => embed.url !== url)
    setDraftStateEmbeds(newEmbeds)
  }

  const removeRecastEmbed = (hash: any) => {
    const newEmbeds = draftState.embeds.filter((embed) => embed.cast_id.hash !== hash)
    setDraftStateEmbeds(newEmbeds)
  }

  const textAreaRef = (node) => {
    setTextareaElement(node);
    if (node && !textAreaFocused) {
      node.focus()
      setTextAreaFocused(true)
    }
  }

  const fetchSingleDraft = async () => {
    const accessToken = await getAccessToken();

    const response = await axios.get(`${HOST_URL}/api/drafts/${draftId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid
      }
    });

    return response.data;
  }

  const DraftQuery = useQuery(
    ['draft', draftId],
    fetchSingleDraft,
    {
      enabled: !!draftId && !!prevDraftId,
    }
  );

  useEffect(() => {
    if (!!draftId) {
      DraftQuery.refetch()
    }

    if (!draftId && !!initialRecastId) {
      setDraftState({
        text: initialText || '',
        embeds: [{ cast_id: initialRecastId }]
      });
    }
  }, [openDraftComposeWindow])

  const handleCreateDraft = async () => {
    setAutosaveInProgress(true)
    const accessToken = await getAccessToken();

    const data = {
      text: draftState.text,
      embeds: draftState.embeds,
      channelId: !!currentChannel ? currentChannel.id : null
    }

    axios.post(`${HOST_URL}/api/drafts/`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
        'draftId': draftId
      }
    }).then((response) => {
      setCurrentDraft(response.data.draft)
      setCurrentDraftReplies([{
        id: '',
        parentId: response.data.draft.id,
        text: '',
        embeds: [],
      } as Draft])
      setDraftId(response.data.draft.id)
      addNewDraftToColumn(response.data.draft)
    }).finally(() => {
      setAutosaveInProgress(false)
    })
  }

  const handleAnonSwitch = async (isAnon: boolean) => {
    setAutosaveInProgress(true)
    const accessToken = await getAccessToken();

    const data = {
      isAnon: isAnon
    }

    await axios.put(`${HOST_URL}/api/drafts/${draftId}/switch-anon`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid
      }
    }).then((response) => {
      setCurrentDraft(response.data.draft)
      updateExistingDraftInColumn(response.data.draft)
    }).finally(() => {
      setAutosaveInProgress(false)
    })
  }

  const handleUpdateDraft = async () => {
    setAutosaveInProgress(true)
    const accessToken = await getAccessToken();

    const data = {
      text: draftState.text,
      embeds: draftState.embeds,
    }

    axios.put(`${HOST_URL}/api/drafts/${draftId}`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid
      }
    }).then((response) => {
      setCurrentDraft(response.data.draft)
      updateExistingDraftInColumn(response.data.draft)
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

  const fetchChannelInfoAndSetCurrentChannel = async (channelId: string) => {

    const accessToken = await getAccessToken();

    axios.get(`${HOST_URL}/api/channels/${channelId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
      .then((response) => {
        setCurrentChannel(response.data.channel)
      })

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
        if (draftId) {
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
    if (DraftQuery.isSuccess) {
      setCurrentDraft(DraftQuery.data.draft);
      const dummyReply = {
        id: '',
        parentId: DraftQuery.data.replies.length > 0 ? DraftQuery.data.replies[DraftQuery.data.replies.length - 1].id : DraftQuery.data.draft.id,
        text: '',
        embeds: [],
      }
      setCurrentDraftReplies([...DraftQuery.data.replies, dummyReply]);
      setDraftState({
        text: DraftQuery.data.draft.text,
        embeds: DraftQuery.data.draft.embeds
      });
      setLastSnapshotDraftState({
        text: DraftQuery.data.draft.text,
        embeds: DraftQuery.data.draft.embeds
      });

      if (!!DraftQuery.data.draft.channelId && DraftQuery.data.draft.channelId !== currentChannel?.id) {
        setCurrentChannel({
          id: DraftQuery.data.draft.channelId,
          name: "loading...",
          created_at: 0,
          description: "",
          image_url: "",
        });
        fetchChannelInfoAndSetCurrentChannel(DraftQuery.data.draft.channelId);
      } else {
        setCurrentChannel(null)
      }
    }
  }, [DraftQuery.data]);

  useEffect(() => {
    if (!draftId) {
      if (!!initialRecastId) {
        setDraftState({
          text: initialText || '',
          embeds: [{ cast_id: initialRecastId }]
        });
      } else {
        setDraftState({
          text: initialText || '',
          embeds: initialEmbeds || []
        });
      }
    }
  }, [initialText, initialEmbeds, initialRecastId, draftId]);

  return (
    <div>
      {DraftQuery.isLoading
        ?
        <Spinner />
        :
        <div className="flex items-start gap-x-4 h-full" onClick={() => {
          if (textareaElement !== activeTextArea) {
            textareaElement.focus()
          }
        }}>
          <div className={`flex-shrink-0 flex flex-col items-center h-full`}>
            <img
              className="inline-block h-12 w-12 object-cover rounded-full flex-shrink-0"
              src={currentDraft?.isAnon ? '/superanon.png' : supercastUserState.accounts.find((account) => account.fid === supercastUserState.currentFid)?.avatar}
              alt=""
            />
            {!(editingDisabled && currentDraftReplies.length === 1) && (
              <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-800"></div>
            )}
          </div>
          <div className="flex flex-col gap-y-1 flex-grow">
            <div className="flex flex-row gap-x-1 items-center">
              <span className="text-gray-900 dark:text-gray-100 font-semibold -mb-0.5 truncate">{currentDraft?.isAnon ? 'anon' : truncateLongWord(currentAccount?.displayName, 16)}</span>
              {(!currentDraft?.isAnon && currentAccount.powerBadge) && <PowerBadge />}
              {isSupercastMember(currentAccount.fid) && <CastoraBadge />}
              <span className="text-gray-500 text-sm font-light">@{currentDraft?.isAnon ? 'superanon' : currentAccount?.username}</span>
              <div className='flex lg:hidden flex-row-reverse justify-end sm:flex-row sm:justify-normal items-center gap-x-2'>
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
            <div className="">
              <label className="sr-only">
                Create your cast
              </label>
              <TextareaAutosize
                id={`draft-toplevel`}
                onChange={(e) => handleNewCastText(e.target.value)}
                value={draftState.text}
                className="block w-full resize-none border-0 bg-transparent py-1.5 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 sm:text-sm sm:leading-6 focus:outline-none disabled:opacity-50"
                placeholder="Create your cast"
                ref={textAreaRef}
                onSelect={(e) => handleSelectTextArea(e)}
                disabled={editingDisabled}
              />
              <div className='absolute z-30 left-18'>
                <MentionAutocomplete autocompleteSuggestions={autocompleteSuggestionQuery.data ? autocompleteSuggestionQuery.data.users : []} setMentionUsername={setMentionUsername} />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 pr-2 gap-y-1">
              {(textareaElement && (activeTextArea === textareaElement)) &&
                <div className='flex flex-row gap-x-1'>
                  {isMobile && <ChannelPickerButton currentDraft={currentDraft} setCurrentDraft={setCurrentDraft} updateExistingDraftInColumn={updateExistingDraftInColumn} />}
                  {isMobile && <ScheduleButton datePicked={datePicked} setDatePicked={setDatePicked} scheduleDate={scheduleDate} setScheduleDate={setScheduleDate} currentDraft={currentDraft} setCurrentDraft={setCurrentDraft} updateExistingDraftInColumn={updateExistingDraftInColumn} />}
                  <UploadButton currentDraft={currentDraft} uploadedCid={uploadedCid} setCid={setCid} filename={filename} setFilename={setFilename} castEmbeds={draftState.embeds} setCastEmbeds={setDraftStateEmbeds} textAreaElement={textareaElement} />
                  {/* <PollButton currentDraft={currentDraft} castEmbeds={draftState.embeds} setCastEmbeds={setDraftStateEmbeds} castText={draftState.text} setCastText={setDraftStateText} /> */}
                  <GIPHYButton currentDraft={currentDraft} castEmbeds={draftState.embeds} setCastEmbeds={setDraftStateEmbeds} />
                  {!isMobile && <EmojiPickerButton currentDraft={currentDraft} castText={draftState.text} setCastText={setDraftStateText} textareaElement={textareaElement} cursorPosition={cursorPosition} />}
                  {ANON_MODE_ENABLED && <AnonButton currentDraft={currentDraft} handleAnonSwitch={handleAnonSwitch} />}
                  <CharacterCounter castLength={stringByteLength(draftState.text)} />
                </div>
              }
              <div className='hidden lg:flex flex-row-reverse justify-end sm:flex-row sm:justify-normal items-center gap-x-2'>
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
                    className='absolute z-50 right-1 top-1 p-0.5 bg-white hover:bg-gray-100 flex justify-center items-center rounded-full border border-gray-400'
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-400" />
                  </button>
                  <URLPreviewCard key={embed.url} url={embed.url} small={true} castHash={''} />
                </div>
              ))}
              {draftState.embeds.map((embed, index) => (
                !!embed.cast_id &&
                <div
                  key={embed.url + index}
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
      }
    </div>
  );
}
