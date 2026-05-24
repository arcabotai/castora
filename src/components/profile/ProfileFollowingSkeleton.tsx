import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const ProfileFollowingSkeleton = () => {
  return (
    <div
      className='border-t border-gray-200 dark:border-gray-800 flex flex-row items-center px-4 py-3 group'
    >
      <div className="flex flex-col text-sm">
        <div className="flex flex-row items-center mb-2 shrink-0">
          <Skeleton className='h-10 w-10 rounded-full mr-4' />
          <div className='flex flex-col gap-y-1'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-20' />
          </div>
        </div>
        <div className="flex-grow flex flex-col gap-y-2 pl-14">
          <p className="text-md break-words text-gray-500">
            <Skeleton className='h-4 w-64' />
          </p>
          <div className="flex flex-row text-sm items-center gap-x-2">
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-20' />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileFollowingSkeleton
