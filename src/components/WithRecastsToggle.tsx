import { Switch } from '@headlessui/react'

import { classNames } from '@/utils/classNames'

export default function WithRecastsToggle({ withRecasts, setWithRecasts }) {

  const handleToggle = () => {
    setWithRecasts(!withRecasts)
    localStorage.setItem('withRecasts', JSON.stringify(!withRecasts))
  }

  return (
    <Switch.Group as="div" className="flex flex-row items-center gap-x-1">
      <Switch.Label as="span" className="text-xs mr-0.5">
        <span className="font-medium text-gray-500 ml-3">Recasts</span>{' '}
      </Switch.Label>
      <Switch
        checked={withRecasts}
        onChange={() => handleToggle()}
        className={classNames(
          withRecasts ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700',
          'relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none'
        )}
      >
        <span
          aria-hidden="true"
          className={classNames(
            withRecasts ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
          )}
        />
      </Switch>
    </Switch.Group>
  )
}
