import { truncateLongWord } from '@/utils/textUtils';
import { LinkIcon } from '@heroicons/react/24/outline';

import { useState, useEffect } from 'react'


interface Props {
  image: string,
  title: string,
  description: string,
  small: boolean,
  url: string,
}

export default function OtherURLPreview(props: Props) {

  const { title, description, small, url } = props

  const [image, setImage] = useState(props.image)

  return (
    <a onClick={(e) => e.stopPropagation()} href={url} target='_blank' className='block p-2 border border-gray-200 dark:border-gray-800 rounded-md sm:hover:bg-gray-100 sm:dark:hover:bg-gray-700 overflow-hidden'>
      <div className={`flex ${small ? 'flex-row' : 'flex-row'} gap-x-2`}>
        <div className='shrink-0'>
          {!!image
            ? <img
              src={image}
              className={`object-cover ${small ? 'h-full w-[100px]' : 'h-[100px] w-[160px] '} rounded-sm`}
              onError={(e) => {
                setImage('')
              }}
            >
            </img>
            : <div className={`bg-gray-200 flex justify-center items-center object-cover ${small ? 'h-full w-[80px]' : 'h-[100px] w-[160px] '}`}>
              <LinkIcon className='w-8 h-8 my-4' />
            </div>
          }
        </div>
        <div className=''>
          {!!title &&
            <div className='font-semibold dark:text-gray-100'>{truncateLongWord(title, (small ? 20 : 32))}</div>
          }
          {!!description &&
            <div className='text-xs text-gray-500 mb-2'>{truncateLongWord(description, (small ? 60 : 120))}</div>
          }
          <div className='text-xs text-gray-500'>{truncateLongWord(url, 28)}</div>
        </div>
      </div>
    </a>
  );
}
