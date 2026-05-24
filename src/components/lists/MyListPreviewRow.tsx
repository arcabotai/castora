import { LockClosedIcon } from "@heroicons/react/24/solid"
import { GlobeAltIcon } from "@heroicons/react/24/outline"

interface MyListPreviewRowProps {
  list: any
}

export default function MyListPreviewRow(props: MyListPreviewRowProps) {

  const { list } = props

  return (
    <div className="flex flex-col py-2 px-1">
      <div className="flex flex-row justify-between items-center">
        <div className='flex flex-col gap-y-1'>
          <span className='text-lg dark:text-gray-100 font-semibold'>{list.name}</span>
          <div className='flex flex-row items-center'>
            <span className='text-xs text-gray-500'>{list.membershipCount} members</span>
            <span className='text-gray-500 mx-1'></span>
            <span className='text-xs text-gray-500'>{list.followingCount} followers</span>
          </div>
        </div>
        <div className="flex flex-row items-center">
          {list.private ? (
            <LockClosedIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" title="Private list" />
          ) : (
            <GlobeAltIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" title="Public list" />
          )}
        </div>
      </div>
    </div>
  )
}
