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
    date: '2026-06-22',
    title: 'Command palette (⌘K)',
    tag: 'feature',
    items: [
      'Press ⌘K (or Ctrl+K) anywhere to open a quick command palette — jump to any page, start a new cast, switch accounts, change the theme, or search for people and channels, all from the keyboard.',
    ],
  },
  {
    date: '2026-06-22',
    title: 'Tabbed notifications',
    tag: 'feature',
    items: [
      'Notifications now have tabs — All, Replies, Mentions, Likes, Recasts, and Follows — so you can jump straight to the type you care about.',
      'Replies and mentions now show the cast they\'re responding to, inline, so you get the full context without opening the thread.',
    ],
  },
  {
    date: '2026-06-22',
    title: 'Multiple accounts are back',
    tag: 'feature',
    items: [
      'Connect more than one Farcaster account and switch between them from the profile menu — browse, post, and get notifications as any of your accounts.',
      'The "Add account" button works again (sign in with Neynar): a new account is attached alongside your existing ones instead of replacing them.',
      'Share access to an account with another Castora user from Settings — handy for teams managing accounts together.',
    ],
  },
  {
    date: '2026-06-22',
    title: 'Fixes & hardening',
    tag: 'fix',
    items: [
      'Fixed a rare issue where a brief backend hiccup could empty your timeline or bounce you to the connect-account screen while you were still signed in. The app now treats a momentary outage as something to retry instead of mistaking it for a sign-out — retrying automatically and showing a simple "try again" screen instead of leaving you on a blank or stuck page.',
      'Fixed the preview image shown when a Castora cast is shared elsewhere — it was failing to render.',
      'Behind-the-scenes reliability and security work: sturdier handling of malformed requests, safer link previews, a hardened crypto-payment webhook, and a cleanup of unused code and dependencies.',
    ],
  },
  {
    date: '2026-05-31',
    title: 'Public source release',
    tag: 'launch',
    items: [
      'Opened the Castora source code to the public, with contributing guidelines, a security policy, and licensing information.',
    ],
  },
  {
    date: '2026-05-29',
    title: 'Reliability, security & transparency',
    tag: 'security',
    items: [
      'Centralized all Farcaster data access behind a single, server-only client for safer and more consistent loading.',
      'Added continuous integration — every change is now type-checked, built, and scanned for leaked secrets before it ships.',
      'Secured all sensitive scheduled jobs behind a secret key so only Castora\'s background workers can trigger them.',
      'Fixed a notifications loading hiccup that could happen on the home feed.',
      'Improved local development so the app always talks to its own environment instead of defaulting to production.',
      'Launched this changelog so you can follow every improvement we ship.',
    ],
  },
  {
    date: '2026-05-27',
    title: 'Analytics & performance',
    tag: 'infra',
    items: [
      'Turned on product analytics and response caching for faster page loads.',
      'Quieted noisy log output in production to make it easier to spot real issues.',
    ],
  },
  {
    date: '2026-05-26',
    title: 'Wallets, profiles & our new home',
    tag: 'feature',
    items: [
      'Launched the wallet page (powered by Privy) and restored wallet creation, with a timing fix so wallets load reliably once you\'re signed in.',
      'Fixed public profile sign-in state and made feeds more resilient when the cache is cold.',
      'Moved to our permanent home at castora.social, with automatic redirects from the old address.',
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
      'Launched Castora: a sharper Farcaster client by Arca, with fast feeds, an improved compose experience, cleaner profiles, and useful notifications.',
      'Built on a modern, production-ready stack (Next.js, Postgres, Redis, Vercel) ready for secure, scalable development.',
      'Prepared the app for public use: cleaned up inherited code, locked down configuration, and set up environment variables for safe deployment.',
    ],
  },
]
