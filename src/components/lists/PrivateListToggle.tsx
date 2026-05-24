import { Switch } from '@/components/ui/switch'

export default function PrivateListToggle({ publicStatus, handleChangePrivateStatus }) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">Private</span>
      <Switch
        checked={publicStatus}
        onCheckedChange={handleChangePrivateStatus}
      />
      <span className="text-sm text-gray-500 dark:text-gray-400">Public</span>
    </div>
  )
}
