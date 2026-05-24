import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";
import { HOST_URL } from "@/utils/hostURL";
import { usePrivy } from "@privy-io/react-auth";
import axios from "axios";
import { UseQueryResult, useQuery } from "react-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EllipsisHorizontalIcon, PaperAirplaneIcon, ClockIcon, PencilIcon } from "@heroicons/react/24/solid";
import { truncateLongWord } from "@/utils/textUtils";
import { Loader2, PenBoxIcon } from "lucide-react";
import { CheckCircleIcon, CheckIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { DRAFT_SEND_STATUS, Draft } from "@prisma/client";
import Spinner from "@/components/Spinner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-sorting";
import Image from "next/image";
import { toast } from "sonner";



interface DraftsColumnProps {
  draftId: string;
  setDraftId: (draftId: string) => void;
  setPrevDraftId: (draftId: string) => void;
  DraftsQuery: UseQueryResult<Draft[], unknown>;
  drafts: Draft[];
  setDrafts: (drafts: Draft[]) => void;
  setCurrentDraftReplies: (drafts: Draft[]) => void;
}

export default function DraftsColumn(props: DraftsColumnProps) {

  const {
    draftId,
    setDraftId,
    setPrevDraftId,
    DraftsQuery,
    drafts,
    setDrafts,
    setCurrentDraftReplies
  } = props;

  const { supercastUserState } = useSupercastUserState();
  const { getAccessToken } = usePrivy();
  const [deletingDraftsList, setDeletingDraftsList] = useState<string[]>([]);
  const [loadingCreateDraft, setLoadingCreateDraft] = useState(false);
  const [loadingDeleteAllDrafts, setLoadingDeleteAllDrafts] = useState(false);

  const [sortingMode, setSortingMode] = useState<"createdASC" | "createdDESC" | "scheduledASC" | "scheduledDESC">("createdDESC");

  const handleSelectedDraft = (newDraftId: string) => {
    if (newDraftId !== draftId) {
      setCurrentDraftReplies([]);
    }
    setPrevDraftId(!!draftId ? draftId : "empty");
    setDraftId(newDraftId);
  }

  const handleDeleteDraft = async (e: React.MouseEvent, deletedDraftId: string) => {

    e.preventDefault();
    e.stopPropagation();

    setDeletingDraftsList([...deletingDraftsList, deletedDraftId]);

    const accessToken = await getAccessToken();

    axios.delete(`${HOST_URL}/api/drafts/${deletedDraftId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid
      }
    }).then(() => {
      const newDrafts = drafts.filter((draft) => draft.id !== deletedDraftId);
      setDrafts(newDrafts);
      // if the deleted draft is the current draft, set draft id to the first one
      if (draftId === deletedDraftId) {
        setDraftId(newDrafts.length > 0 ? newDrafts[0].id : null);
      }
    }).catch((error) => {
      console.error(error);
    }).finally(() => {
      setDeletingDraftsList(deletingDraftsList.filter((id) => id !== deletedDraftId));
    });
  }

  const handleDeleteAllDrafts = async () => {

    setLoadingDeleteAllDrafts(true);

    const accessToken = await getAccessToken();

    axios.delete(`${HOST_URL}/api/drafts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid
      }
    }).then((response) => {
      setDrafts(response.data.drafts);
      setDraftId(response.data.drafts.length > 0 ? response.data.drafts[0].id : null);
    }).catch((error) => {
      toast.error("Failed to delete all drafts");
    }).finally(() => {
      setLoadingDeleteAllDrafts(false);
    });
  }

  const createNewDraft = async () => {

    setLoadingCreateDraft(true);

    const accessToken = await getAccessToken();

    const data = {
      text: "",
      embeds: [],
      channelId: null
    }

    axios.post(`${HOST_URL}/api/drafts`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid
      }
    }).then((response) => {
      const newDraft = response.data.draft;
      setPrevDraftId(draftId);
      setDraftId(newDraft.id);
      setDrafts([newDraft, ...drafts]);
    }).catch((error) => {
      console.error(error);
    }).finally(() => {
      setLoadingCreateDraft(false);
    })
  }

  const sortScheduledDESC = (a: Draft, b: Draft) => {
    const date1 = a.nextScheduledAt ? new Date(a.nextScheduledAt).getTime() : 0;
    const date2 = b.nextScheduledAt ? new Date(b.nextScheduledAt).getTime() : 0;

    return date2 - date1;
  }

  const sortScheduleASC = (a: Draft, b: Draft) => {
    const date1 = a.nextScheduledAt ? new Date(a.nextScheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
    const date2 = b.nextScheduledAt ? new Date(b.nextScheduledAt).getTime() : Number.MAX_SAFE_INTEGER;

    return date1 - date2;
  }

  const sortCreatedDESC = (a: Draft, b: Draft) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }

  const sortCreatedASC = (a: Draft, b: Draft) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }

  const draftsFilteringFunction = (draft: Draft) => {
    switch (sortingMode) {
      case "createdASC":
        return true;
      case "createdDESC":
        return true;
      case "scheduledASC":
        return draft.sendStatus === DRAFT_SEND_STATUS.SCHEDULED;
      case "scheduledDESC":
        return draft.sendStatus === DRAFT_SEND_STATUS.SCHEDULED;
    }
  }

  const draftsSortingFunction = (a: Draft, b: Draft) => {
    switch (sortingMode) {
      case "createdASC":
        return sortCreatedASC(a, b);
      case "createdDESC":
        return sortCreatedDESC(a, b);
      case "scheduledASC":
        return sortScheduleASC(a, b);
      case "scheduledDESC":
        return sortScheduledDESC(a, b);
    }
  }


  return (
    <div className="flex flex-col justify-between h-[92vh]">
      <div className="overflow-auto flex-grow">
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 px-4 tracking-tight">Drafts</h2>
        </div>
        <div className="flex flex-col gap-y-4 mt-2">
          <Button
            variant="outline"
            className="text-xs py-1 mx-4 flex items-center gap-x-2"
            disabled={DraftsQuery.isLoading || DraftsQuery.isError || !draftId}
            onClick={createNewDraft}
          >
            {loadingCreateDraft
              ?
              <Spinner width="w-3" height="h-3" margin="m-0" padding="p-0" color="text-gray-500" fill="fill-gray-300" />
              :
              <div className="border border-gray-500 rounded-md p-0.5">
                <PencilIcon className="w-[10px] h-[10px] text-gray-500 dark:text-gray-300" />
              </div>
            }
            New draft
          </Button>
          {DraftsQuery.isLoading && <Spinner width="w-5" height="h-5" margin="mt-2" padding="p-0" />}
          {DraftsQuery.isError && <div>Error fetching drafts</div>}
          {DraftsQuery.isSuccess && drafts.length === 0 && <div className="flex flex-row justify-start items-center px-4">
            <div className="text-sm text-gray-500 dark:text-gray-300">No drafts yet</div>
          </div>}
          <div className="flex flex-col divide-y">
            {DraftsQuery.isSuccess && drafts.filter(draftsFilteringFunction).sort(draftsSortingFunction).map((draft) => (
              <div
                key={draft.id} className="flex flex-row justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-800 hover:cursor-pointer transition-colors duration-100 ease-in-out"
                onClick={() => { handleSelectedDraft(draft.id) }}
              >
                <div className="flex flex-row space-x-2">
                  <div className="flex flex-col">
                    <div className="text-xs text-gray-500 dark:text-gray-300 mb-4">{draft.text ? truncateLongWord(draft.text, 32) : "No text"}</div>
                    <div className="flex flex-row gap-x-1 items-center leading-3 mb-1">
                      <div className="text-xs text-gray-500 dark:text-gray-300">{`${draft.embeds.length} embed${draft.embeds.length !== 1 ? "s" : ""}`}</div>
                      <span className='text-gray-500 dark:text-gray-400'>·</span>
                      <div className="text-xs text-gray-500 dark:text-gray-300">{draft.channelId ? "/" + draft.channelId : "No channel"}</div>
                    </div>
                    <div className="flex flex-row gap-x-1 items-center leading-3">
                      {draft.embeds.length > 0 && draft.embeds.map((embed, index) => (
                        // @ts-ignore
                        !!embed.url && (['.jpg', '.png', '.gif', '.svg', '.bmp'].includes(embed.url.slice(-4).toLowerCase()) || ['.webp', '.jpeg'].includes(embed.url.slice(-5).toLowerCase())) &&
                        <img
                          key={"draftEmbeds" + index + draft.id}
                          // @ts-ignore
                          src={embed.url}
                          alt="embed"
                          className="rounded-sm object-cover h-[40px] w-[60px]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between items-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <EllipsisHorizontalIcon className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                    </DropdownMenuTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <button
                            className="flex flex-row items-center gap-x-2 px-1 py-1 w-full text-sm text-red-500"
                            onClick={(e) => { handleDeleteDraft(e, draft.id) }}
                          >
                            {deletingDraftsList.includes(draft.id) ? <Spinner width="w-4" height="h-4" margin="m-0" padding="p-0" color="text-red-500" fill="fill-red-300" /> : <TrashIcon className="w-4 h-4" />}
                            Delete draft
                          </button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenuPortal>
                  </DropdownMenu>
                  {draft.sendStatus === DRAFT_SEND_STATUS.DRAFT &&
                    <div className="border border-gray-500 rounded-md p-0.5">
                      <PencilIcon className="w-3 h-3 text-gray-500" />
                    </div>
                  }
                  {draft.sendStatus === DRAFT_SEND_STATUS.SCHEDULED &&
                    <div className="flex flex-row gap-x-2 items-end">
                      {/* display in format dd/mm/yyy hh:mm */}
                      <p className="text-[10px] text-blue-500">{new Date(draft.nextScheduledAt).toLocaleString().slice(0, 17)}</p>
                      <div className="border border-blue-500 rounded-md p-0.5">
                        <ClockIcon className="w-3 h-3 text-blue-500" />
                      </div>
                    </div>
                  }
                  {draft.sendStatus === DRAFT_SEND_STATUS.SENT &&
                    <div className="border border-green-500 rounded-md p-0.5">
                      <PaperAirplaneIcon className="w-3 h-3 text-green-500" />
                    </div>
                  }
                  {draft.sendStatus === DRAFT_SEND_STATUS.ERROR &&
                    <div className="border border-red-500 rounded-md p-0.5">
                      <XMarkIcon className="w-3 h-3 text-red-500" />
                    </div>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 text-xs flex justify-between border-t dark:border-gray-800 pt-2">
        <Button
          variant="outline"
          size="xs"
          className="text-xs h-8 flex items-center gap-x-2"
          onClick={handleDeleteAllDrafts}
        >
          {loadingDeleteAllDrafts ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
          Delete all drafts
        </Button>
        {/* @ts-ignore */}
        <Select onValueChange={(value) => { setSortingMode(value) }} value={sortingMode}>
          <SelectTrigger className="text-xs">
            <SelectValue className="text-xs" placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="createdDESC" className="text-xs">↓ Created </SelectItem>
              <SelectItem value="createdASC" className="text-xs">↑ Created</SelectItem>
              <SelectItem value="scheduledDESC" className="text-xs">↓ Scheduled</SelectItem>
              <SelectItem value="scheduledASC" className="text-xs">↑ Scheduled</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}