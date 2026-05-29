// Single source of truth for the public changelog at /changelog.
//
// When you ship a user-facing change, prepend an entry here (newest first) and
// mirror it in the repo-root CHANGELOG.md. Keep wording user-friendly — this is
// read by people, not engineers. See AGENTS.md for the full process.

export type ChangelogTag = 'launch' | 'feature' | 'fix' | 'security' | 'infra'

export type ChangelogEntry = {
  /** ISO date, e.g. "2026-05-29" */
  date: string
  /** Short, human title for the batch of changes */
  title: string
  /** Primary category, used for the badge color */
  tag: ChangelogTag
  /** User-facing bullet points */
  items: string[]
}

export const changelog: ChangelogEntry[] = [
  {
    date: '2026-05-29',
    title: 'Reliability & security hardening',
    tag: 'security',
    items: [
      'Centralized all Farcaster data access behind a single, server-only client for safer and more consistent loading.',
      'Added continuous integration — every change is now type-checked, built, and scanned for leaked secrets before it ships.',
      'Audited every sensitive endpoint and locked down background/scheduled jobs behind a secret.',
      'Fixed a notifications loading hiccup and quieted noisy developer logs.',
      'Improved local development so the app always talks to its own environment.',
      'Launched this changelog so you can follow every improvement, step by step.',
    ],
  },
  {
    date: '2026-05-27',
    title: 'Analytics & performance',
    tag: 'infra',
    items: [
      'Turned on product analytics and response caching for faster page loads.',
    ],
  },
  {
    date: '2026-05-26',
    title: 'Wallets, profiles & our new home',
    tag: 'feature',
    items: [
      'Launched the wallet page (powered by Privy) and restored wallet creation.',
      'Fixed public profile sign-in state and made feeds more resilient when the cache is cold.',
      'Moved to our permanent home at castora.social, with redirects from the old address.',
    ],
  },
  {
    date: '2026-05-25',
    title: 'Login, accounts & polish',
    tag: 'feature',
    items: [
      'Added sign-in and Farcaster account connection via Neynar.',
      'Hardened upload and webhook authentication.',
      'Cleaned up branding, tweet embeds, and scrolling; polished the landing experience on web and mobile.',
    ],
  },
  {
    date: '2026-05-24',
    title: 'Castora is born',
    tag: 'launch',
    items: [
      'Launched the first Castora build — a sharper Farcaster client by Arca, on a production-ready foundation.',
    ],
  },
]
