import { useDraftComposeWindow } from '@/providers/DraftComposeWindowProvider';
import { useOpenCastModal } from '@/providers/OpenCastModalProvider';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import { PlusIcon } from '@heroicons/react/24/outline';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { PLAN } from '@prisma/client';
import { usePrivy } from '@privy-io/react-auth';
import React, { useEffect } from 'react';

const GlobalCastButton: React.FC = () => {

  const { openDraftComposeWindow, setOpenDraftComposeWindow } = useDraftComposeWindow()
  const { supercastUserState } = useSupercastUserState()
  const { authenticated } = usePrivy()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault()
        setOpenDraftComposeWindow((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setOpenDraftComposeWindow])

  return (
    <button
      type="button"
      onClick={() => setOpenDraftComposeWindow(true)}
      className={
        `${(openDraftComposeWindow || supercastUserState === undefined || !authenticated) ? "hidden" : ""} w-16 h-16 bg-black rounded-full flex items-center justify-center shadow-lg dark:bg-slate-700 dark:shadow-none sm:hover:bg-opacity-80 transition-opacity z-[100] bottom-24 fixed sm:bottom-6 right-4 sm:right-1/2 sm:translate-x-[600px]`
      }
    >
      <PaperAirplaneIcon className='h-7 w-7 text-white' />
    </button>
  );
};

export default GlobalCastButton;
