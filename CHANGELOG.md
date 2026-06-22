# Changelog

How Castora is getting sharper, step by step. This is the repo-side mirror of
the public changelog at [castora.social/changelog](https://castora.social/changelog).

> **Updating this file:** when you ship a user-facing change, add an entry to
> `src/app/changelog/entries.ts` (the website source of truth, newest first) and
> mirror it here. Keep wording user-friendly. See `AGENTS.md`.

## 2026-06-22 — Sign-in reliability
- Fixed a rare issue where a brief backend hiccup could empty your timeline or bounce you to the connect-account screen even while you were still signed in. The app now treats a momentary outage as something to retry, instead of mistaking it for a sign-out.

## 2026-05-29 — Reliability & security hardening
- Centralized all Farcaster data access behind a single, server-only client for safer and more consistent loading.
- Added continuous integration — every change is now type-checked, built, and scanned for leaked secrets before it ships.
- Audited every sensitive endpoint and locked down background/scheduled jobs behind a secret.
- Fixed a notifications loading hiccup and quieted noisy developer logs.
- Improved local development so the app always talks to its own environment.
- Launched this changelog so you can follow every improvement, step by step.

## 2026-05-27 — Analytics & performance
- Turned on product analytics and response caching for faster page loads.

## 2026-05-26 — Wallets, profiles & our new home
- Launched the wallet page (powered by Privy) and restored wallet creation.
- Fixed public profile sign-in state and made feeds more resilient when the cache is cold.
- Moved to our permanent home at castora.social, with redirects from the old address.

## 2026-05-25 — Login, accounts & polish
- Added sign-in and Farcaster account connection via Neynar.
- Hardened upload and webhook authentication.
- Cleaned up branding, tweet embeds, and scrolling; polished the landing experience on web and mobile.

## 2026-05-24 — Castora is born
- Launched the first Castora build — a sharper Farcaster client by Arca, on a production-ready foundation (bootstrapped from a Supercast base).
