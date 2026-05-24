import { useState, forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { ChevronDownIcon } from '@heroicons/react/20/solid'

import 'react-datepicker/dist/react-datepicker.css';
import { XMarkIcon } from '@heroicons/react/24/outline';

export const ScheduleDatePicker = ({ datePicked, setDatePicked, scheduleDate, setScheduleDate }) => {

  const handlePickDate = (date: Date) => {
    setDatePicked(true)
    setScheduleDate(date)
  }

  const handleUnschedule = (e) => {
    setDatePicked(false)
    setScheduleDate(new Date())
    e.stopPropagation()
    e.preventDefault()
  }

  // @ts-ignore
  const ScheduleButton = forwardRef(({ value, onClick }, ref) => (
    // @ts-ignore
    <button ref={ref}
      className="rounded-md bg-white dark:bg-gray-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
      onClick={onClick}
    >
      {datePicked
        ?
        <div
          className='flex flex-row items-center'
        >
          {value}
          <XMarkIcon onClick={(e) => handleUnschedule(e)} className="ml-1 h-5 w-5 text-gray-400 hover:text-gray-900" aria-hidden="true" />
        </div>
        : <div
          className='flex flex-row items-center'>
          {"Schedule"}
          {<ChevronDownIcon className="ml-1 h-5 w-5 text-gray-400" aria-hidden="true" />}
        </div>
      }
    </button>
  ));

  return (
    <div className='flex flex-row items-center gap-x-2'>
      <DatePicker
        selected={scheduleDate}
        onChange={(date) => handlePickDate(date)}
        showTimeSelect
        dateFormat="yyyy/MM/dd h:mm aa"
        minDate={new Date()}
        timeIntervals={5}
        customInput={<ScheduleButton />}
      />
    </div>
  );
};