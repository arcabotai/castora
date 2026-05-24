import React from 'react';
import Image from 'next/image';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import { useMobileSidebar } from '@/providers/MobileSidebarProvider';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';

interface MobileHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
}

export default function MobileHeader({ title, rightAction }: MobileHeaderProps) {
  const { supercastUserState } = useSupercastUserState();
  const { setOpenSidebar } = useMobileSidebar();
  const currentAccount = supercastUserState.accounts.find(
    (account) => account.fid === supercastUserState.currentFid
  );

  return (
    <div className='fixed lg:static top-0 left-0 right-0 z-10 flex items-center justify-between py-2 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900'>
      <div className='lg:hidden w-8 h-8' onClick={() => setOpenSidebar(true)}>
        <Avatar className='h-8 w-8'>
          <AvatarImage
            src={currentAccount?.avatar}
            alt='Profile picture'
          />
          <AvatarFallback>
            <Skeleton
              className="h-8 w-8"
            />
          </AvatarFallback>
        </Avatar>
      </div>
      <h2 className="text-black dark:text-gray-100 font-semibold text-sm lg:text-base">
        {title}
      </h2>
      <div className="w-8 h-8 flex items-center justify-end">
        {rightAction}
      </div>
    </div>
  );
}