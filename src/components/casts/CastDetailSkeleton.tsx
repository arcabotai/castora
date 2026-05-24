import { Skeleton } from '../ui/skeleton'

export default function CastDetailSkeleton() {
  return (
    <div className="flex space-x-4 dark:border-gray-800 px-4 pt-2">
      <Skeleton className="rounded-full h-12 w-12" />
      <div className="flex-1 space-y-4 py-1">
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <div className="flex flex-row gap-x-4 w-full">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  )
}