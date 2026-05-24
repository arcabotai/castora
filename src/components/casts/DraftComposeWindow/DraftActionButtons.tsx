import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";
import { ArrowPathIcon, ClockIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { DRAFT_SEND_STATUS, Draft } from "@prisma/client";
import Link from "next/link";
import { isMobile } from 'react-device-detect';

interface DraftActionButtonsProps {
  currentDraft: Draft | undefined;
  loadingSend: boolean;
  loadingSchedule: boolean;
  handleSendCast: () => void;
  handleCastSchedule: () => void;
  setOpenDraftComposeWindow: (open: boolean) => void;
  setDraftId: (id: string | undefined) => void;
}

export default function DraftActionButtons({
  currentDraft,
  loadingSend,
  loadingSchedule,
  handleSendCast,
  handleCastSchedule,
  setOpenDraftComposeWindow,
  setDraftId,
}: DraftActionButtonsProps) {
  if (currentDraft === undefined) {
    return (
      <Button className="w-full flex flex-row items-center justify-center gap-x-2 flex-grow" disabled>
        {loadingSend ? <Spinner width='w-4' height='h-4' margin='m-0' padding='p-0' /> : <PaperAirplaneIcon className="h-4 w-4" />}
        Post
      </Button>
    );
  }

  const formatScheduledTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  switch (currentDraft.sendStatus) {
    case DRAFT_SEND_STATUS.DRAFT:
      if (currentDraft.firstScheduledAt) {
        return (
          <Button className="w-full flex flex-row items-center justify-center gap-x-2" onClick={handleCastSchedule}>
            {loadingSchedule ? <Spinner width='w-4' height='h-4' margin='m-0' padding='p-0' /> : <ClockIcon className="h-4 w-4" />}
            {isMobile ? formatScheduledTime(new Date(currentDraft.firstScheduledAt)) : "Schedule"}
          </Button>
        );
      }
      return (
        <Button className="w-full flex flex-row items-center justify-center gap-x-2" onClick={handleSendCast}>
          {loadingSend ? <Spinner width='w-4' height='h-4' margin='m-0' padding='p-0' /> : <PaperAirplaneIcon className="h-4 w-4" />}
          Post
        </Button>
      );
    case DRAFT_SEND_STATUS.SCHEDULED:
      return (
        <Button className="w-full bg-blue-500 dark:bg-blue-500" disabled>
          {isMobile && currentDraft.nextScheduledAt
            ? formatScheduledTime(new Date(currentDraft.nextScheduledAt))
            : "Scheduled"}
        </Button>
      );
    case DRAFT_SEND_STATUS.SENT:
      return (
        <Link href={`/c/${currentDraft.castHash}`} className="flex-grow">
          <Button
            className="w-full bg-green-500 hover:bg-green-400 dark:bg-green-500 dark:hover:bg-green-400 flex-grow"
            onClick={() => {
              setOpenDraftComposeWindow(false);
              setDraftId(undefined);
            }}
          >
            Display cast
          </Button>
        </Link>
      );
    case DRAFT_SEND_STATUS.ERROR:
      return (
        <Button
          className="w-full flex flex-row items-center justify-center gap-x-2 bg-red-500 hover:bg-red-400 dark:bg-red-500 dark:hover:bg-red-400"
          onClick={handleSendCast}
        >
          {loadingSend ? <Spinner width='w-4' height='h-4' margin='m-0' padding='p-0' /> : <ArrowPathIcon className="h-4 w-4" />}
          Error sending cast. Retry now.
        </Button>
      );
    default:
      return null;
  }
}