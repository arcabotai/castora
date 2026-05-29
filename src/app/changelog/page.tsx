import type { Metadata } from 'next'
import { changelog, type ChangelogTag } from './entries'

export const metadata: Metadata = {
  title: 'Changelog · Castora',
  description: 'How Castora is getting sharper, step by step.',
}

const TAG_STYLES: Record<ChangelogTag, { label: string; className: string }> = {
  launch: { label: 'Launch', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  feature: { label: 'Feature', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  fix: { label: 'Fix', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  security: { label: 'Security', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  infra: { label: 'Infra', className: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
}

function formatDate(iso: string): string {
  // Parse as UTC to keep the rendered date stable regardless of server timezone.
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export default function ChangelogPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-gray-700 dark:text-gray-200">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
        Changelog
      </h1>
      <p className="mb-10 text-sm text-gray-500 dark:text-gray-400">
        How Castora is getting sharper, step by step. We ship improvements continuously — here&apos;s the trail.
      </p>

      <ol className="relative border-l border-gray-200 dark:border-gray-800">
        {changelog.map((entry) => {
          const tag = TAG_STYLES[entry.tag]
          return (
            <li key={`${entry.date}-${entry.title}`} className="mb-10 ml-6">
              <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-gray-300 dark:border-gray-950 dark:bg-gray-700" />
              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <time className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  {formatDate(entry.date)}
                </time>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tag.className}`}>
                  {tag.label}
                </span>
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-950 dark:text-gray-50">
                {entry.title}
              </h2>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-6">
                {entry.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </li>
          )
        })}
      </ol>

      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
        Built by <a className="underline" href="https://arcabot.ai">Arca</a>.
      </p>
    </main>
  )
}
