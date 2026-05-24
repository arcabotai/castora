import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { MoonIcon as MoonIconOutline } from '@heroicons/react/24/outline';
import { MoonIcon as MoonIconFull } from '@heroicons/react/24/solid';

export default function ZenModeButton({
  zenMode,
  setZenMode,
}: {
  zenMode: boolean,
  setZenMode: React.Dispatch<React.SetStateAction<boolean>>,
}) {

  return (
    <button
      type="button"
      onClick={() => setZenMode((prev) => !prev)}
      className="hidden sm:inline-flex w-full gap-x-1.5 rounded-md bg-white dark:bg-gray-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      {zenMode ? <MoonIconFull className='w-5 h-5 text-gray-500' /> : <MoonIconOutline className='w-5 h-5 text-gray-500' />}
    </button>
  )
}