import { useState, forwardRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import 'react-datepicker/dist/react-datepicker.css';
import { CheckCircleIcon, ClockIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ClockIcon as ClockIconSolid } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { DRAFT_SEND_STATUS, Draft } from '@prisma/client';
import { usePrivy } from '@privy-io/react-auth';
import axios from 'axios';
import { HOST_URL } from '@/utils/hostURL';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import Spinner from '@/components/Spinner';
import { toast } from 'sonner';
import { isMobile } from 'react-device-detect';
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose, DrawerFooter } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ScheduleButtonProps {
  datePicked: boolean;
  setDatePicked: (datePicked: boolean) => void;
  scheduleDate: Date;
  setScheduleDate: (scheduleDate: Date) => void;
  currentDraft: Draft;
  setCurrentDraft: (draft: Draft) => void;
  updateExistingDraftInColumn: (updatedDraft: any) => void;
}

export const ScheduleButton = (props: ScheduleButtonProps) => {

  const { supercastUserState } = useSupercastUserState();
  const { getAccessToken } = usePrivy();
  const [loadingSetSchedule, setLoadingSetSchedule] = useState(false);
  const [loadingUnschedule, setLoadingUnschedule] = useState(false);
  const [loadingRecurring, setLoadingRecurring] = useState(false);

  const { datePicked, setDatePicked, scheduleDate, setScheduleDate, currentDraft, setCurrentDraft, updateExistingDraftInColumn } = props;

  const [recurringState, setRecurringState] = useState<string>("NONE");

  const [isOpen, setIsOpen] = useState(false);

  const handlePickDate = async (e, date: Date) => {
    // very ugly hack. e is undefined when the time is picked, but is defined when the date is picked.
    // we want to use this function only when time is picked, not date.
    if (e !== undefined) {
      setScheduleDate(date)
      return
    }

    setLoadingSetSchedule(true)

    const accessToken = await getAccessToken();

    const data = {
      firstScheduledAt: date,
    }

    axios.put(`${HOST_URL}/api/drafts/${currentDraft.id}`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid
      }
    }).then((response) => {
      setCurrentDraft(response.data.draft)
    }).finally(() => {
      setLoadingSetSchedule(false)
    })

    setDatePicked(true)
    setScheduleDate(date)
    setIsOpen(false);
  }

  const handleUnschedule = async (e) => {

    setLoadingUnschedule(true)

    const accessToken = await getAccessToken();

    axios.post(`${HOST_URL}/api/drafts/${currentDraft.id}/unschedule`, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid
      }
    }).then((response) => {
      updateExistingDraftInColumn(response.data.draft)
      setCurrentDraft(response.data.draft)
      setDatePicked(false)
      setScheduleDate(new Date())
    }).catch((error) => {
      toast.error("Error scheduling cast")
    }).finally(() => {
      setLoadingUnschedule(false)
    })
  }

  const handleSetRecurring = async (recurring: string) => {

    setLoadingRecurring(true)

    const accessToken = await getAccessToken();

    const data = {
      recurring: recurring,
    }

    axios.put(`${HOST_URL}/api/drafts/${currentDraft.id}`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid
      }
    }).then((response) => {
      setCurrentDraft(response.data.draft)
    }).finally(() => {
      setLoadingRecurring(false)
    })
  }

  const handleButtonClick = (e) => {
    if (isMobile && currentDraft && currentDraft.nextScheduledAt) {
      handleUnschedule(e);
    } else {
      setIsOpen(true);
    }
  };

  const renderDatePicker = () => (
    <DatePicker
      selected={scheduleDate}
      onChange={(e, date) => handlePickDate(date, e)}
      showTimeSelect
      dateFormat="yyyy/MM/dd h:mm aa"
      minDate={new Date()}
      timeIntervals={5}
      inline
    />
  );

  const triggerButton = (
    <Button
      variant="outline"
      className={`flex flex-row items-center justify-center gap-x-2 lg:w-full h-9 px-3 lg:h-10 lg:px-2`}
      disabled={loadingSetSchedule || loadingUnschedule || !currentDraft || (currentDraft !== undefined && !!currentDraft.nextScheduledAt && !isMobile) || (currentDraft !== undefined && currentDraft.sendStatus === DRAFT_SEND_STATUS.SENT)}
      onClick={handleButtonClick}
    >
      <div className='flex flex-row items-center gap-x-2'>
        {loadingSetSchedule || (isMobile && loadingUnschedule)
          ?
          <Spinner width='w-5 lg:w-4' height='h-5 lg:h-4' margin='m-0' padding='p-0' />
          : (currentDraft !== undefined && !!currentDraft.nextScheduledAt)
            ?
            <ClockIconSolid className="h-5 w-5 lg:h-4 lg:w-4 text-green-500 lg:text-black lg:dark:text-white" />
            :
            <ClockIcon className="h-5 w-5 lg:h-4 lg:w-4 text-gray-500 lg:text-black lg:dark:text-white" />
        }
        <div className='hidden lg:block'>
          {"Pick time"}
        </div>
      </div>
    </Button>
  );

  useEffect(() => {
    if (currentDraft !== undefined) {
      setRecurringState(currentDraft.recurring)
    }
  }, [currentDraft])

  return (
    <div className='flex flex-row items-center lg:w-full'>
      {isMobile ? (
        <>
          {triggerButton}
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerContent>
              <div className="p-4">
                {renderDatePicker()}
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            {triggerButton}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            {renderDatePicker()}
          </PopoverContent>
        </Popover>
      )}
      {(currentDraft !== undefined && !!currentDraft.nextScheduledAt) &&
        <div className='hidden lg:flex w-full'>
          <Button
            variant="outline"
            onClick={handleUnschedule}
            className='flex flex-row items-center gap-x-2 mx-2 w-full'
            disabled={loadingUnschedule || (currentDraft !== undefined && currentDraft.sendStatus === DRAFT_SEND_STATUS.SENT)}
          >
            <p>{new Date(currentDraft.nextScheduledAt).toLocaleString()}</p>
            {loadingUnschedule ? <Spinner width='w-4' height='h-4' margin='m-0' padding='p-0' /> : <TrashIcon className="h-4 w-4" />}
          </Button>
        </div>
      }
      {(currentDraft !== undefined && !!currentDraft.nextScheduledAt) &&
        <div className='ml-1 lg:ml-0 lg:w-full'>
          <Select onValueChange={handleSetRecurring} value={recurringState}>
            <SelectTrigger
              className={`lg:w-full h-9 px-3 lg:h-10 lg:px-2`}
              disabled={loadingUnschedule || loadingRecurring || (currentDraft !== undefined && (currentDraft.sendStatus === DRAFT_SEND_STATUS.SCHEDULED || currentDraft.sendStatus === DRAFT_SEND_STATUS.SENT))}
            >
              <SelectValue placeholder="Once" />
            </SelectTrigger>
            <SelectContent
              ref={(ref) => {
                if (!ref) return;
                ref.ontouchstart = (e) => e.preventDefault();
              }}
            >
              <SelectGroup>
                <SelectItem value="NONE">Once</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      }
    </div>
  );
};