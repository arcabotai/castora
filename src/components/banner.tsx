import { XMarkIcon } from '@heroicons/react/20/solid'

export default function Banner() {
  return (
    <div className="flex items-center justify-center gap-x-1 bg-yellow-400 px-6 py-2 sm:px-3.5 text-sm leading-6 text-yellow-900 ">
      <p>
        Notifications performance is downgraded. In case of any issues, please contact us on{' '}
        <a href="https://t.me/+Er85coELb7s0NDJk" target='_blank' className='hover:underline'>
          telegram {'->'}
        </a>
      </p>
    </div>
  )
}
