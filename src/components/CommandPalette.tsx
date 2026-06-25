'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Command } from 'cmdk'
import { Dialog, Transition } from '@headlessui/react'
import { useRouter } from 'next/navigation'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTheme } from 'next-themes'
import axios from 'axios'
import { usePrivy } from '@privy-io/react-auth'
import { HOST_URL } from '@/utils/hostURL'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { useDraftComposeWindow } from '@/providers/DraftComposeWindowProvider'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Skeleton } from './ui/skeleton'

type Cmd = { label: string; hint?: string; run: () => void }

const groupClass =
  '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:dark:text-gray-500'
const itemClass =
  'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 cursor-pointer aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800'
const hintClass = 'text-xs text-gray-400 dark:text-gray-500 font-mono shrink-0'

// A ⌘K / Ctrl+K command palette: navigate, compose, switch account, theme, and
// jump to people/channels. Mounted once in Layout.
export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<{ users: any[]; channels: any[] }>({ users: [], channels: [] })
  const inputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()
  const { setTheme } = useTheme()
  const { getAccessToken } = usePrivy()
  const { supercastUserState, getCurrentProfile, switchAccount } = useSupercastUserState()
  const { setOpenDraftComposeWindow } = useDraftComposeWindow()

  useHotkeys(
    'meta+k, ctrl+k',
    (e) => { e.preventDefault(); setOpen((o) => !o) },
    { enableOnFormTags: true, enableOnContentEditable: true },
  )

  useEffect(() => { if (!open) setSearch('') }, [open])

  const run = useCallback((fn: () => void) => { setOpen(false); fn() }, [])

  // Debounced people/channel search via the existing suggestions endpoint.
  useEffect(() => {
    const q = search.trim()
    if (!open || q.length < 2) { setResults({ users: [], channels: [] }); return }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const accessToken = await getAccessToken()
        const res = await axios.get(`${HOST_URL}/api/search-suggestions?query=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${accessToken}`, asFid: supercastUserState?.currentFid },
        })
        if (!cancelled) setResults({ users: res.data?.users || [], channels: res.data?.channels || [] })
      } catch {
        if (!cancelled) setResults({ users: [], channels: [] })
      }
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [search, open, getAccessToken, supercastUserState?.currentFid])

  const profile = getCurrentProfile()

  const navCommands: Cmd[] = [
    { label: 'Home', hint: 'g h', run: () => router.push('/') },
    { label: 'Notifications', hint: 'g n', run: () => router.push('/notifications') },
    { label: 'Explore', run: () => router.push('/explore') },
    { label: 'Bookmarks', hint: 'g b', run: () => router.push('/bookmarks') },
    { label: 'Lists', hint: 'g l', run: () => router.push('/lists') },
    { label: 'Drafts', run: () => router.push('/drafts') },
    { label: 'Scheduled', run: () => router.push('/scheduled') },
    { label: 'Community', hint: 'g c', run: () => router.push('/community') },
    { label: 'Wallet', run: () => router.push('/wallet') },
    { label: 'Settings', hint: 'g s', run: () => router.push('/settings') },
    ...(profile?.username ? [{ label: 'My profile', hint: 'g p', run: () => router.push(`/${profile.username}`) }] : []),
  ]

  const actionCommands: Cmd[] = [
    { label: 'New cast', hint: '⌘ P', run: () => setOpenDraftComposeWindow(true) },
    { label: 'Theme: Light', run: () => setTheme('light') },
    { label: 'Theme: Dark', run: () => setTheme('dark') },
    { label: 'Theme: System', run: () => setTheme('system') },
  ]

  const q = search.trim().toLowerCase()
  const matches = (label: string) => !q || label.toLowerCase().includes(q)
  const navFiltered = navCommands.filter((c) => matches(c.label))
  const actionFiltered = actionCommands.filter((c) => matches(c.label))
  const otherAccounts = (supercastUserState?.accounts || []).filter(
    (a: any) =>
      a.fid !== supercastUserState?.currentFid &&
      (!q || a.username?.toLowerCase().includes(q) || a.displayName?.toLowerCase().includes(q)),
  )

  const isEmpty =
    !navFiltered.length && !actionFiltered.length && !otherAccounts.length && !results.users.length && !results.channels.length

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" initialFocus={inputRef} onClose={setOpen}>
        <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-start justify-center px-4 pt-[14vh]">
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="w-full max-w-lg overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
              <Command shouldFilter={false} loop label="Command palette">
                <Command.Input
                  ref={inputRef}
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search or jump to…"
                  className="w-full border-0 border-b border-gray-100 dark:border-gray-800 bg-transparent px-4 py-3 text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
                <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                  {isEmpty && <div className="px-3 py-6 text-center text-sm text-gray-400">No results.</div>}

                  {navFiltered.length > 0 && (
                    <Command.Group heading="Navigate" className={groupClass}>
                      {navFiltered.map((c) => (
                        <Command.Item key={c.label} value={`nav-${c.label}`} onSelect={() => run(c.run)} className={itemClass}>
                          <span className="truncate">{c.label}</span>
                          {c.hint && <span className={hintClass}>{c.hint}</span>}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}

                  {actionFiltered.length > 0 && (
                    <Command.Group heading="Actions" className={groupClass}>
                      {actionFiltered.map((c) => (
                        <Command.Item key={c.label} value={`action-${c.label}`} onSelect={() => run(c.run)} className={itemClass}>
                          <span className="truncate">{c.label}</span>
                          {c.hint && <span className={hintClass}>{c.hint}</span>}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}

                  {otherAccounts.length > 0 && (
                    <Command.Group heading="Switch account" className={groupClass}>
                      {otherAccounts.map((a: any) => (
                        <Command.Item key={a.fid} value={`account-${a.fid}`} onSelect={() => run(() => switchAccount(a.fid))} className={itemClass}>
                          <span className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-5 w-5 shrink-0"><AvatarImage src={a.avatar} alt="" /><AvatarFallback><Skeleton className="h-5 w-5" /></AvatarFallback></Avatar>
                            <span className="truncate">@{a.username}</span>
                          </span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}

                  {results.users.length > 0 && (
                    <Command.Group heading="People" className={groupClass}>
                      {results.users.map((u: any) => (
                        <Command.Item key={`u-${u.fid}`} value={`user-${u.fid}`} onSelect={() => run(() => router.push(`/${u.username}`))} className={itemClass}>
                          <span className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-5 w-5 shrink-0"><AvatarImage src={u.pfp_url} alt="" /><AvatarFallback><Skeleton className="h-5 w-5" /></AvatarFallback></Avatar>
                            <span className="truncate">{u.display_name} <span className="text-gray-400">@{u.username}</span></span>
                          </span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}

                  {results.channels.length > 0 && (
                    <Command.Group heading="Channels" className={groupClass}>
                      {results.channels.map((ch: any) => (
                        <Command.Item key={`c-${ch.id}`} value={`channel-${ch.id}`} onSelect={() => run(() => router.push(`/channel/${ch.id}`))} className={itemClass}>
                          <span className="truncate">/{ch.id}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}
                </Command.List>
              </Command>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
