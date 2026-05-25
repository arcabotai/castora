import React from 'react';
import Image from 'next/image';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import { useMobileSidebar } from '@/providers/MobileSidebarProvider';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';

interface FeedHeaderProps {
  title?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  rightAction2?: React.ReactNode;
}

export default function FeedHeader({ title, rightAction, rightAction2, leftAction }: FeedHeaderProps) {
  const { supercastUserState, isGuest } = useSupercastUserState();
  const { setOpenSidebar } = useMobileSidebar();
  const currentAccount = supercastUserState.accounts.find(
    (account) => account.fid === supercastUserState.currentFid
  );

  const renderMobileHeader = () => (
    <div className='flex items-center justify-between py-2 px-4 sm:px-6 bg-white dark:bg-gray-900'>
      <div className="w-24">
        <div
          className='w-10 h-10 flex items-center justify-center focus:outline-none active:scale-90 transition-all duration-150 ease-in-out cursor-pointer'
          onClick={() => setOpenSidebar(true)}
        >
          <Avatar className='h-8 w-8'>
            <AvatarImage
              src={isGuest() ? '/castora-mark.svg' : currentAccount?.avatar}
              alt='Profile picture'
            />
            <AvatarFallback>
              <Skeleton
                className="h-8 w-8"
              />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      {title && (
        <h2 className="text-black dark:text-gray-100 font-semibold text-base">
          {title}
        </h2>
      )}
      <div className="w-24 flex flex-row items-center justify-end">
        <div className="w-10 h-10 flex items-center justify-end">
          {rightAction2}
        </div>
        <div className="w-10 h-10 flex items-center justify-end">
          {rightAction}
        </div>
      </div>
    </div>
  );

  const renderDesktopHeader = () => (
    <div className='flex items-center justify-between py-2 px-8 bg-white dark:bg-gray-900'>
      <div className="flex items-center">
        {leftAction || (title && (
          <h2 className="text-black dark:text-gray-100 font-semibold text-base">
            {title}
          </h2>
        ))}
      </div>
      <div className="flex items-center">
        {rightAction}
      </div>
    </div>
  );

  return (
    <div className=''>
      <div className='fixed top-0 left-0 right-0 z-10 lg:hidden'>
        {renderMobileHeader()}
      </div>
      <div className='hidden lg:block'>
        {renderDesktopHeader()}
      </div>
    </div>
  );
}