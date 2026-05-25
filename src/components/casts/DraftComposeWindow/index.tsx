import { useEffect, useState } from "react";
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";
import { useDraftComposeWindow } from "@/providers/DraftComposeWindowProvider";
import { Dialog, DialogContent } from "@/components/ui/window";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useMediaQuery } from '@/hooks/useMediaQuery';
import defaultStyle from "./defaultStyle";
import mentionStyle from "./mentionStyle";
import { usePrivy } from "@privy-io/react-auth";
import { Channel, UserMin } from "@/types";
import axios from "axios";
import { HOST_URL } from "@/utils/hostURL";
import PowerBadge from "@/components/PowerBadge";
import { truncateLongWord } from "@/utils/textUtils";
import { useCurrentChannel } from "@/providers/CurrentChannelProvider";
import DraftComposeUnit from "./DraftComposeUnit";
import { Button } from "@/components/ui/button";
import { ArrowPathIcon, ArrowUpOnSquareIcon, ClockIcon, EnvelopeIcon, HomeIcon, PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/outline";
import DraftsColumn from "./DraftsColumn";
import { toast } from "sonner";
import { useQuery } from "react-query";
import { DRAFT_SEND_STATUS, Draft } from "@prisma/client";
import { ScheduleButton } from "./ScheduleButton";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import ChannelPreviewColumn from "./ChannelPreviewColumn";
import DraftComposeReply from "./DraftComposeReply";
import { useDraftId } from "@/providers/DraftIdProvider";
import { useOpenSignerApproval } from "@/providers/OpenSignerApprovalProvider";
import { ZapIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ChannelPickerButton from "../ChannelPickerButton";
import { useSelectedCast } from "@/providers/SelectedCastProvider";
import DraftActionButtons from "./DraftActionButtons";
import { useIosPwa } from "@/providers/iOSPwaProvider";

const ANON_ERROR_MESSAGES = {
  "ANON_INVALID_CONTENT_TICKER": "Tickers are not allowed",
  "ANON_INVALID_CONTENT_MENTION": "Token launches are not allowed",
  "ANON_INVALID_CONTENT_ETH": "Token addresses are not allowed",
  "ANON_INVALID_CONTENT_SOL": "Token addresses are not allowed",
  "ANON_INVALID_CONTENT_URL": "Token links are not allowed",
  "ANON_EMPTY_QUOTE": "Empty quotes not allowed",
  "ANON_RATE_LIMITED": "Max 1 anon post per hour",
  "ANON_USER_BANNED": "You are banned from anonymous posting",
  "ANON_NO_PLAN": "You must be a member to post anonymously"
}

export default function DraftComposeWindow() {
  const { openDraftComposeWindow, setOpenDraftComposeWindow } = useDraftComposeWindow();
  const isMobile = useMediaQuery('(max-width: 640px)');
  const { draftId, setDraftId } = useDraftId();
  const { supercastUserState } = useSupercastUserState();
  const { getAccessToken } = usePrivy();
  const { setOpenSignerApproval } = useOpenSignerApproval()
  const { navigateToCast } = useSelectedCast()
  const { isIosPwa } = useIosPwa();

  const [prevDraftId, setPrevDraftId] = useState<string>();
  const [currentDraft, setCurrentDraft] = useState<Draft>();
  const [currentDraftReplies, setCurrentDraftReplies] = useState<Draft[]>([{
    id: '',
    parentId: "",
    text: '',
    embeds: [],
  } as Draft]);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const [datePicked, setDatePicked] = useState(false)
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingShare, setLoadingShare] = useState(false);

  const editingDisabled = !!draftId && !!currentDraft && !(currentDraft.sendStatus === DRAFT_SEND_STATUS.DRAFT || currentDraft.sendStatus === DRAFT_SEND_STATUS.ERROR);

  const addNewDraftToColumn = (newDraft: Draft) => {
    setDrafts((drafts) => [newDraft, ...drafts]);
  }

  const updateExistingDraftInColumn = (updatedDraft: Draft) => {
    setDrafts(drafts.map(draft => draft.id === updatedDraft.id ? updatedDraft : draft));
  }

  const currentAccount: UserMin = supercastUserState.accounts.find((account) => account.fid === supercastUserState.currentFid);

  const fetchDrafts = async () => {
    const accessToken = await getAccessToken();

    const response = await axios.get(`${HOST_URL}/api/drafts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid
      }
    });

    return response.data.drafts;
  }

  const DraftsQuery = useQuery(
    ['draftsColumn', supercastUserState.currentFid, openDraftComposeWindow],
    fetchDrafts,
    {
      enabled: supercastUserState.currentFid !== 0 && openDraftComposeWindow
    }
  );

  const handleClickDisplayCast = (e: React.MouseEvent, hash: string) => {
    navigateToCast(e, hash)
  }

  const sendCast = async (castDraftId: string) => {
    const accessToken = await getAccessToken();

    await axios.post(`${HOST_URL}/api/drafts/${castDraftId}/send`, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid
      }
    }).then(async (response) => {
      if (!!response.data.draft.replyDraft) {
        await sendCast(response.data.draft.replyDraft.id)
      }
      if (response.data.draft.isTopLevel) {
        updateExistingDraftInColumn(response.data.draft)
      }

      if (response.data.draft.isTopLevel) {
        toast.success(`Cast sent`, {
          action: {
            label: 'Display',
            onClick: (e) => handleClickDisplayCast(e, response.data.draft.castHash),
          },
        })
        setCurrentDraftReplies([{
          id: '',
          parentId: "",
          text: '',
          embeds: [],
        } as Draft])
      }

      setOpenDraftComposeWindow(false)
    }).catch((error) => {
      if (error.response.data.error === "NO_SIGNER_APPROVED") {
        setOpenSignerApproval(true)
      } else if (error.response.data.error.startsWith("ANON_")) {
        toast.error(ANON_ERROR_MESSAGES[error.response.data.error])
      } else {
        toast.error('Error sending cast')
      }
    }).finally(() => {
      setLoadingSend(false)
    })
  }

  const handleSendCast = async () => {
    setLoadingSend(true)

    sendCast(draftId)
  }

  const handleCastSchedule = async () => {

    setLoadingSchedule(true)

    const accessToken = await getAccessToken();

    axios.post(`${HOST_URL}/api/drafts/${draftId}/schedule`, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid
      }
    }).then((response) => {
      updateExistingDraftInColumn(response.data.draft)
      setCurrentDraft(response.data.draft)
    }).catch((error) => {
      if (error.response.data.error === "NO_SIGNER_APPROVED") {
        setOpenSignerApproval(true)
      } else {
        toast.error('Error scheduling cast')
      }
    }).finally(() => {
      setLoadingSchedule(false)
    })
  }

  const [activeTextArea, setActiveTextArea] = useState<HTMLTextAreaElement | null>(null);

  const handleFocusIn = (e) => {
    if (document.activeElement instanceof HTMLTextAreaElement) {
      setActiveTextArea(document.activeElement);
    }
  }

  useEffect(() => {
    document.addEventListener('focusin', handleFocusIn)
    return () => {
      document.removeEventListener('focusin', handleFocusIn)
    };
  }, [])

  // on tab, focus on the next textarea
  const handleTab = (e) => {
    if (!e.shiftKey && e.key === 'Tab') {
      e.preventDefault();
      // take current draft id, and all draft ids from the replies and put in a list
      const allDraftIds = ['toplevel', ...currentDraftReplies.map(draft => (draft.id ? draft.id : "new"))];
      const currentId = activeTextArea.id.split("draft-")[1]
      const currentDraftIndex = allDraftIds.indexOf(currentId);
      // take next draft id
      const nextDraftId = allDraftIds[currentDraftIndex + 1];
      // take textarea associated with next draft id
      const nextTextArea = document.getElementById(`draft-${nextDraftId}`)
      // focus on that textarea
      if (nextTextArea) {
        nextTextArea.focus();
      }
    }

    // on shift+tab, focus on the previous textarea
    if (e.shiftKey && e.key === 'Tab') {
      e.preventDefault();
      // take current draft id, and all draft ids from the replies and put in a list
      const allDraftIds = ['toplevel', ...currentDraftReplies.map(draft => (draft.id ? draft.id : "new"))];
      const currentId = activeTextArea.id.split("draft-")[1]
      const currentDraftIndex = allDraftIds.indexOf(currentId);
      if (currentDraftIndex === 0) return;
      // take previous draft id
      const prevDraftId = allDraftIds[currentDraftIndex - 1];
      // take textarea associated with previous draft id
      const prevTextArea = document.getElementById(`draft-${prevDraftId}`)
      // focus on that textarea
      if (prevTextArea) {
        prevTextArea.focus();
      }
    }
  }

  useEffect(() => {
    if (activeTextArea) {
      activeTextArea.addEventListener('keydown', handleTab);
      return () => {
        activeTextArea.removeEventListener('keydown', handleTab);
      };
    }
  }, [activeTextArea, currentDraftReplies])

  // on cmd + enter or crl + enter, send the cast
  const handleSendCastShortcut = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendCast();
    }
  }

  const handleShareDraftLink = async () => {

    setLoadingShare(true)

    const accessToken = await getAccessToken();

    const data = {
      shared: true
    }

    axios.put(`${HOST_URL}/api/drafts/${draftId}`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid
      }
    }).then((response) => {
      const draftLink = `${HOST_URL}/drafts/${draftId}`

      navigator.clipboard.writeText(draftLink)

      toast.success('Draft link copied to clipboard')
    }).finally(() => {
      setLoadingShare(false)
    })
  }

  useEffect(() => {
    if (activeTextArea && openDraftComposeWindow && draftId) {
      activeTextArea.addEventListener('keydown', handleSendCastShortcut);
      return () => {
        activeTextArea.removeEventListener('keydown', handleSendCastShortcut);
      };
    }
  }, [activeTextArea, openDraftComposeWindow, draftId])

  // after drafts are fetched, set the drafts state
  useEffect(() => {
    if (DraftsQuery.isSuccess) {
      setDrafts(DraftsQuery.data);
    }
  }, [DraftsQuery.data]);

  const content = (
    <div className="flex overflow-hidden pt-2 lg:pt-0 h-full">
      <div className="w-1/4 border-r dark:border-gray-800 hidden lg:block">
        <DraftsColumn
          draftId={draftId}
          setDraftId={setDraftId}
          setPrevDraftId={setPrevDraftId}
          DraftsQuery={DraftsQuery}
          drafts={drafts}
          setDrafts={setDrafts}
          setCurrentDraftReplies={setCurrentDraftReplies}
        />
      </div>
      <div className="flex flex-col justify-between w-full lg:w-1/2 h-full max-h-full">
        <div className="lg:hidden w-full h-10 flex flex-row items-center justify-between px-4 mb-4">
          <div>
            <Button
              variant="ghost"
              onClick={() => setOpenDraftComposeWindow(false)}
            >
              Close
            </Button>
          </div>
          <div className="flex flex-row items-center gap-x-2">
            <Link
              href="/drafts"
              onClick={() => setOpenDraftComposeWindow(false)}
            >
              <Button
                variant="outline"
                className="flex flex-row items-center gap-x-2"
              >
                Drafts
              </Button>
            </Link>
            <DraftActionButtons
              currentDraft={currentDraft}
              loadingSend={loadingSend}
              loadingSchedule={loadingSchedule}
              handleSendCast={handleSendCast}
              handleCastSchedule={handleCastSchedule}
              setOpenDraftComposeWindow={setOpenDraftComposeWindow}
              setDraftId={setDraftId}
            />
          </div>
        </div>
        <div className="flex flex-col gap-y-4 overflow-auto flex-grow px-4">
          <DraftComposeUnit
            draftId={draftId}
            setDraftId={setDraftId}
            prevDraftId={prevDraftId}
            currentDraft={currentDraft}
            setCurrentDraft={setCurrentDraft}
            currentDraftReplies={currentDraftReplies}
            setCurrentDraftReplies={setCurrentDraftReplies}
            currentAccount={currentAccount}
            addNewDraftToColumn={addNewDraftToColumn}
            updateExistingDraftInColumn={updateExistingDraftInColumn}
            activeTextArea={activeTextArea}
            editingDisabled={editingDisabled}
            datePicked={datePicked}
            setDatePicked={setDatePicked}
            scheduleDate={scheduleDate}
            setScheduleDate={setScheduleDate}
          />
          {currentDraftReplies.map((draft, index) => (
            <DraftComposeReply
              key={index}
              parentDraftId={draft.parentId}
              thisDraftId={draft.id}
              currentAccount={currentAccount}
              currentDraft={draft}
              currentDraftReplies={currentDraftReplies}
              setCurrentDraftReplies={setCurrentDraftReplies}
              activeTextArea={activeTextArea}
              editingDisabled={editingDisabled}
              isAnon={currentDraft?.isAnon}
            />
          ))}
        </div>
        <div className={`hidden lg:flex flex-col gap-y-2 w-full flex-shrink-0 px-4`}>
          <ChannelPickerButton
            currentDraft={currentDraft}
            setCurrentDraft={setCurrentDraft}
            updateExistingDraftInColumn={updateExistingDraftInColumn}
          />
          <ScheduleButton
            datePicked={datePicked}
            setDatePicked={setDatePicked}
            scheduleDate={scheduleDate}
            setScheduleDate={setScheduleDate}
            currentDraft={currentDraft}
            setCurrentDraft={setCurrentDraft}
            updateExistingDraftInColumn={updateExistingDraftInColumn}
          />
          <div className="hidden lg:block">
            <DraftActionButtons
              currentDraft={currentDraft}
              loadingSend={loadingSend}
              loadingSchedule={loadingSchedule}
              handleSendCast={handleSendCast}
              handleCastSchedule={handleCastSchedule}
              setOpenDraftComposeWindow={setOpenDraftComposeWindow}
              setDraftId={setDraftId}
            />
          </div>
        </div>
      </div>
      <div className="w-1/4 max-w-[25%] border-l dark:border-gray-800 hidden lg:block">
        <ChannelPreviewColumn />
      </div>
    </div>
  );

  return (
    <Dialog open={openDraftComposeWindow} onOpenChange={setOpenDraftComposeWindow}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        {content}
      </DialogContent>
    </Dialog>
  );
}
