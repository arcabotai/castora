'use client'

import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";
import { HOST_URL } from "@/utils/hostURL";
import { usePrivy } from "@privy-io/react-auth";
import axios from "axios";
import { useQuery } from "react-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EllipsisHorizontalIcon, PaperAirplaneIcon, ClockIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { truncateLongWord } from "@/utils/textUtils";
import { TrashIcon } from "@heroicons/react/24/outline";
import { DRAFT_SEND_STATUS, Draft } from "@prisma/client";
import Spinner from "@/components/Spinner";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-sorting";
import { useDraftComposeWindow } from "@/providers/DraftComposeWindowProvider";
import { useDraftId } from "@/providers/DraftIdProvider";
import FeedHeader from "@/components/FeedHeader";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerTrigger } from "@/components/ui/drawer";

export default function DraftsFeed() {
  const { supercastUserState } = useSupercastUserState();
  const { getAccessToken } = usePrivy();
  const [deletingDraftsList, setDeletingDraftsList] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const { draftId, setDraftId } = useDraftId();
  const { setOpenDraftComposeWindow } = useDraftComposeWindow();

  const [sortingMode, setSortingMode] = useState<"createdASC" | "createdDESC" | "scheduledASC" | "scheduledDESC">("createdDESC");

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
    ['draftsFeed', supercastUserState.currentFid, draftId],
    fetchDrafts,
    {
      enabled: supercastUserState.currentFid !== 0
    }
  );

  const handleSelectedDraft = (newDraftId: string) => {
    setOpenDraftComposeWindow(true);
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

  const createNewDraft = async () => {
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
      setDraftId(newDraft.id);
      setDrafts([newDraft, ...drafts]);
    }).catch((error) => {
      console.error(error);
    });
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

  useEffect(() => {
    if (DraftsQuery.isSuccess) {
      setDrafts(DraftsQuery.data);
    }
  }, [DraftsQuery.data]);

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSortingChange = (value: string) => {
    setSortingMode(value as any);
    if (!isDesktop) {
      setIsDrawerOpen(false);
    }
  };

  const sortingOptions = [
    { value: "createdDESC", label: "↓ Created" },
    { value: "createdASC", label: "↑ Created" },
    { value: "scheduledDESC", label: "↓ Scheduled" },
    { value: "scheduledASC", label: "↑ Scheduled" },
  ];

  const renderSortingContent = () => (
    <div className="flex flex-col space-y-2">
      {sortingOptions.map((option) => (
        <Button
          key={option.value}
          variant={sortingMode === option.value ? "default" : "ghost"}
          className="justify-start"
          onClick={() => handleSortingChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );

  const sortingButton = (
    isDesktop ? (
      <Select onValueChange={handleSortingChange} value={sortingMode}>
        <SelectTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="flex flex-row items-center justify-center p-0 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
          >
            <FunnelIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </Button>
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            {sortingOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-xs">
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    ) : (
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="flex flex-row items-center justify-center p-0 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
          >
            <FunnelIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Sort Drafts</h3>
            {renderSortingContent()}
          </div>
          <DrawerFooter>
            <DrawerClose>
              <Button variant='secondary' className='w-full'>Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  );

  return (
    <div className="flex flex-col h-full pt-12 lg:pt-0">
      <FeedHeader title="Drafts" rightAction={sortingButton} />
      <div className="overflow-auto flex-grow">
        <div className="flex flex-col gap-y-4">
          {DraftsQuery.isLoading && <Spinner width="w-5" height="h-5" margin="mt-2" padding="p-0" />}
          {DraftsQuery.isError && <div>Error fetching drafts</div>}
          {DraftsQuery.isSuccess && drafts.length === 0 &&
            <div className="flex flex-row justify-center items-center p-4">
              <div className="text-sm text-gray-500 dark:text-gray-300">No drafts yet</div>
            </div>}
          <div className="flex flex-col divide-y">
            {DraftsQuery.isSuccess && drafts.filter(draftsFilteringFunction).sort(draftsSortingFunction).map((draft) => (
              <div
                key={draft.id}
                className="flex flex-row justify-between px-4 sm:px-6 lg:px-8 py-2 h-20 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-800 hover:cursor-pointer transition-colors duration-100 ease-in-out"
                onClick={() => { handleSelectedDraft(draft.id) }}
              >
                <div className="flex flex-row space-x-2">
                  <div className="flex flex-col justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-300">{draft.text ? truncateLongWord(draft.text, 60) : "No text"}</div>
                    <div className="flex flex-row gap-x-1 items-center leading-3">
                      <div className="text-xs text-gray-500 dark:text-gray-300">{draft.embeds.length} embeds</div>
                      <span className='text-gray-500 dark:text-gray-400'>·</span>
                      <div className="text-xs text-gray-500 dark:text-gray-300">{draft.channelId ? "/" + draft.channelId : "No channel"}</div>
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
    </div>
  );
}