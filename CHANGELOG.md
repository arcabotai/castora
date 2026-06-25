# Changelog

How Castora is getting sharper, step by step. This is the repo-side mirror of
the public changelog at [castora.social/changelog](https://castora.social/changelog).

> **Updating this file:** when you ship a user-facing change, add an entry to
> `src/app/changelog/entries.ts` (the website source of truth, newest first) and
> mirror it here. Keep wording user-friendly. See `AGENTS.md`.

## 2026-06-22 — Tabbed notifications
- Notifications now have tabs — All, Replies, Mentions, Likes, Recasts, and Follows — so you can jump straight to the type you care about.
- Replies and mentions now show the cast they're responding to, inline, so you get the full context without opening the thread.

## 2026-06-22 — Multiple accounts are back
- Connect more than one Farcaster account and switch between them from the profile menu — browse, post, and get notifications as any of your accounts.
- The "Add account" button works again (sign in with Neynar): a new account is attached alongside your existing ones instead of replacing them.
- Share access to an account with another Castora user from Settings — handy for teams managing accounts together.

## 2026-06-22 — Fixes & hardening
- Fixed a rare issue where a brief backend hiccup could empty your timeline or bounce you to the connect-account screen while you were still signed in. The app now treats a momentary outage as something to retry instead of mistaking it for a sign-out — retrying automatically and showing a simple "try again" screen instead of leaving you on a blank or stuck page.
- Fixed the preview image shown when a Castora cast is shared elsewhere — it was failing to render.
- Behind-the-scenes reliability and security work: sturdier handling of malformed requests, safer link previews, a hardened crypto-payment webhook, and a cleanup of unused code and dependencies.

## 2026-05-31 — Public source release
- Opened the Castora source code to the public, with contributing guidelines, a security policy, and licensing information.

## 2026-05-29 — Reliability, security & transparency
- Centralized all Farcaster data access behind a single, server-only client for safer and more consistent loading.
- Added continuous integration — every change is now type-checked, built, and scanned for leaked secrets before it ships.
- Secured all sensitive scheduled jobs behind a secret key so only Castora's background workers can trigger them.
- Fixed a notifications loading hiccup that could happen on the home feed.
- Improved local development so the app always talks to its own environment instead of defaulting to production.
- Launched this changelog so you can follow every improvement we ship.

## 2026-05-27 — Analytics & performance
- Turned on product analytics and response caching for faster page loads.
- Quieted noisy log output in production to make it easier to spot real issues.

## 2026-05-26 — Wallets, profiles & our new home
- Launched the wallet page (powered by Privy) and restored wallet creation, with a timing fix so wallets load reliably once you're signed in.
- Fixed public profile sign-in state and made feeds more resilient when the cache is cold.
- Moved to our permanent home at castora.social, with automatic redirects from the old address.

## 2026-05-25 — Login, accounts & polish
- Added sign-in and Farcaster account connection via Neynar.
- Hardened upload and webhook authentication.
- Cleaned up branding, tweet embeds, and scrolling; polished the landing experience on web and mobile.

## 2026-05-24 — Castora is born
- Launched Castora: a sharper Farcaster client by Arca, with fast feeds, an improved compose experience, cleaner profiles, and useful notifications.
- Built on a modern, production-ready stack (Next.js, Postgres, Redis, Vercel) ready for secure, scalable development.
- Prepared the app for public use: cleaned up inherited code, locked down configuration, and set up environment variables for safe deployment.
