import { useOpenHotkeyShortcutWindow } from '@/providers/OpenHotkeyShortcutWindow';
import { useDraftComposeWindow } from '@/providers/DraftComposeWindowProvider';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import { useRouter } from 'next/navigation';
import { useHotkeys } from 'react-hotkeys-hook';
import { useNotifications } from '@/providers/NotificationsProvider';

export default function NavigationHotkeys() {

  const router = useRouter()
  const { getCurrentProfile } = useSupercastUserState()
  const { setOpenHotkeyShortcutWindow } = useOpenHotkeyShortcutWindow()
  const { setOpenDraftComposeWindow } = useDraftComposeWindow()
  const { setSelectedMode } = useNotifications();

  useHotkeys('g+h', () => router.push('/'))
  useHotkeys('g+l', () => router.push('/lists'))
  useHotkeys('g+b', () => router.push('/bookmarks'))
  useHotkeys('g+c', () => router.push('/community'))
  useHotkeys('g+p', () => router.push(`/${getCurrentProfile().username}`))
  useHotkeys('g+s', () => router.push('/settings'))
  useHotkeys('g+n', () => {
    setSelectedMode('all')
    router.push('/notifications')
  })
  useHotkeys('g+m', () => {
    setSelectedMode('mentions')
    router.push('/notifications')
  })

  useHotkeys('meta+/', () => setOpenHotkeyShortcutWindow((prev) => !prev))
  useHotkeys('meta+p', (e) => {
    e.preventDefault()
    setOpenDraftComposeWindow((prev) => !prev)
  })

  return <></>
}