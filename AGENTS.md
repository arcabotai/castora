# AGENTS.md — working on Castora

Guidance for AI agents (and humans) improving this repo and the website. Read this first.

> Castora is a sharper Farcaster client by Arca. Live at **castora.social**. It was
> bootstrapped from a Supercast base and is being rebuilt into an Arca-owned product
> spine, **shipping improvements step by step**.

## Golden rules

1. **Update the changelog on every user-facing change.** This is mandatory, not optional.
   - Prepend an entry (newest first) to `src/app/changelog/entries.ts` — the website source of truth at `/changelog`.
   - Mirror it in the repo-root `CHANGELOG.md`.
   - Keep wording **user-friendly** (people read it, not just engineers). Pick the right `tag`
     (`launch | feature | fix | security | infra`). Group related changes into one dated entry.
2. **Commits must be authored as `arcabotai`, or Vercel won't deploy.** Vercel maps the commit
   **author email** to a Vercel-project member. Use `arcabotai`'s email; the repo is already
   configured with `git config user.email "261107832+arcabotai@users.noreply.github.com"`
   (`arca22775@gmail.com` also works). **Do NOT author commits as `feliramii@gmail.com`** — that
   maps to `felirami`, who lacks project access, and the deploy is **BLOCKED**.
3. **`main` deploys to production.** Merging/pushing to `main` triggers a Vercel **production**
   deploy. Land work via PRs; keep `main` green. CI gates every PR.
4. **Keep deploys boring.** Don't enable side-effectful background jobs, run prod DB migrations,
   or flip risky flags without explicit sign-off. Prefer feature flags + local testing first.

## Architecture conventions (don't regress these)

- **Farcaster / Neynar:** always go through the server-only client `@/lib/neynar` (`neynar.get('/v2/...')`).
  Never hardcode `https://api.neynar.com` or read `process.env.NEYNAR_API_KEY` in a route — that
  was centralized on purpose.
- **API base URL:** use `HOST_URL` from `@/utils/hostURL`. It prefers `window.location.origin` on the
  client so localhost/preview talk to their own origin. Don't reintroduce a hardcoded prod URL.
- **Auth:** API routes use `@/utils/auth/isAuthenticated` + `@/utils/auth/isAuthorized`. Cron /
  scheduled routes use `@/utils/auth/requireCronAuth` (`isCronAuthorized`, fails closed on
  `Authorization: Bearer $CRON_SECRET`).
- **Webhooks** verify signatures/tokens (Stripe `constructEvent`, Neynar signature, Daimo `Basic` token). Keep it that way.

## Local development

```bash
npm install
vercel env pull .env.local --environment=development --yes   # needs `vercel link` to arcas-projects-d844d101/castora
# IMPORTANT: after pulling, set these so localhost talks to itself (pull resets them to prod):
#   NEXT_PUBLIC_APP_URL="http://localhost:3000"
#   NEXT_PUBLIC_URL="http://localhost:3000"
npm run prisma:generate
npm run dev   # http://localhost:3000
```

- Prisma uses `POSTGRES_PRISMA_URL` (pooled) + `POSTGRES_URL_NON_POOLING` (direct). The Prisma CLI
  reads `.env`, not `.env.local`, so for CLI commands: `set -a; . ./.env.local; set +a` first.
- Login is via **Privy** (app id `cmpke74en00660cjvnb9aq32k`; the auth iframe is hosted at the
  custom domain `privy.castora.social`). For localhost login to work, `http://localhost:3000` must be
  in the Privy app's allowed origins (dashboard → Configuration → App settings → Domains).
- Because the Privy auth iframe is **cross-site** (`privy.castora.social`), a browser that **blocks
  third-party cookies** can't read the session → the app silently falls back to **guest**. If you log
  in but stay "guest" in a clean/automation Chrome profile, allow 3rd-party cookies (or launch Chrome
  with `--disable-features=ThirdPartyStoragePartitioning,TrackingProtection3pcd`).
- Unauthenticated API routes returning `401`/`403` is expected (auth gates), not a crash.

## ⚠️ Environments are NOT isolated (important)

The Vercel **Development**, **Preview**, and **Production** environments all use the **same Railway
Postgres database AND the same Privy app** (`cmpke74en…`). There is **no separate dev/staging data**.
Consequences:

- Running `npm run dev` locally talks to the **live production database**. Local reads/writes,
  account connections, and any posting hit **real prod data and real Farcaster accounts**.
- A `prisma migrate`/`db push` run locally would alter the **production** schema. **Never** run DB
  migrations/seeds from local.
- "Run prod on localhost" = `vercel env pull .env.local --environment=production` then re-apply the
  `NEXT_PUBLIC_APP_URL=http://localhost:3000` override. (A dev-env backup can be kept as
  `.env.local.dev.bak`.) Treat the local window as if you're operating on castora.social directly.
- **Recommended next infra step:** stand up a real isolated dev environment (separate Railway DB +
  separate Privy dev app) so local work can't damage production.

## CI (`.github/workflows/ci.yml`)

- **Hard gate:** `typecheck` + `build`. **Non-blocking:** `lint` (project sets `eslint.ignoreDuringBuilds`).
- **Secret scan:** gitleaks. `.gitleaks.toml` allowlists `0x…` EVM addresses (public, not secrets);
  add narrow allowlist entries for other confirmed false positives — never disable the scan.

## Roadmap / known work

- **Workers (`src/scripts/*` were never in this fork; being reconstructed one by one).** All are
  gated by `CRON_SECRET` (`isCronAuthorized`, set in Vercel prod/dev). Status:
  - ✅ **`cast/send-scheduled-drafts`** → `sendScheduledDrafts` (Draft table; recurring + reactions
    via `@/utils/drafts`) and **`cast/send-scheduled`** → `sendScheduledCasts` (ScheduledCast table,
    standalone casts only — threads TODO). Both **reconstructed but OFF**: gated behind
    `CASTORA_ENABLE_SCHEDULED_SENDER=true` AND not in `vercel.json` crons, so they post nothing until
    you set the flag + add the cron. End-to-end posting was NOT tested (would post real casts) —
    verify against a test account / empty schedule before enabling.
  - ⬜ `cancel-expired-subscriptions` (Stripe — cancel logic exists in `stripe/cancel-subscription`; build for review, keep disabled).
  - ⬜ `send-expiration-reminders` (DMs via `@/utils/direct-casts` — needs a Farcaster Direct Cast API key; see Direct Casts note below).
  - **`index-superanon-scores-from-dune` is SHELVED** (kept, not removed). Superanon was a
    Supercast-only feature; its account `@superanon` (fid 862100) has been dormant since
    2025-10-28 and the Dune query was never in this fork, so there is no live data to index. The
    anon-posting idea lives on independently as Anoncast / Anon World ($ANON). Removed from
    vercel.json crons. Do NOT reconstruct unless a live scoring source returns. The leaderboard
    routes + `SuperanonScore` model + `NEXT_PUBLIC_SUPERANON_FID` are dormant legacy.
  - **Direct Casts (DMs):** `@/utils/direct-casts.ts` sends via `api.warpcast.com/v2/ext-send-direct-cast`
    with a Farcaster app API key (`WARPCAST_DM_API_KEY` — rename to `FARCASTER_DM_*` when wiring it).
    Send-only and account-bound; there is no official read/receive DM API, so full native DM parity
    inside Castora is not feasible today (the on-protocol E2E "Direct Casts" FIP is still just a
    proposal). Fine for one-off sends like expiration reminders.

## 🔴 Top-priority bug to fix next: `isAuthenticated` swallows infra errors

`src/utils/auth/isAuthenticated.ts` wraps token verification **and** the
`prisma.supercastPrivyUser.findUnique()` DB lookup in one try/catch that, on **any** error, returns
`{ authenticated: false }`. So a **transient DB outage** (the Railway hobby Postgres blips) makes
every data route 401 → the timeline goes empty and the user can even get dropped into the
**guest / "connect account"** onboarding. Because local == prod data, that onboarding could write
duplicate records into production.

**Fix:** distinguish a genuine token-verification failure (→ real `401`) from an infrastructure
error like a DB connection failure (→ surface a retryable `503`, ideally with a short retry). Do
**not** treat "database unreachable" as "not authenticated." This was the root cause of the
"timeline not showing" incident debugged on 2026-05-30.

## Session handoff (through 2026-05-31)

**Shipped & merged to production this run** (PRs #7, #8, #9, #10, #11, #12 — all CI-green):
- Localhost dev fixed (`hostURL` prefers `window.location.origin`); CI + gitleaks secret scan added.
- Neynar centralized behind `@/lib/neynar` (68 files migrated).
- Sensitive-route audit + cron routes gated by `CRON_SECRET` (`requireCronAuth`); `CRON_SECRET` set
  in Vercel prod/dev.
- Public `/changelog` + `CHANGELOG.md`; this `AGENTS.md`.
- Superanon/Dune worker shelved; scheduled-cast senders reconstructed (OFF behind a flag).

**What's needed next (priority order):**
1. **Fix `isAuthenticated`** (above) — highest value; it's a live footgun given shared prod data.
2. **Isolate environments** — separate dev DB + dev Privy app so local ≠ prod.
3. **Workers:** build `cancel-expired-subscriptions` (Stripe, for review/disabled); wire
   `send-expiration-reminders` once a Farcaster Direct Cast API key is provided; verify the scheduled
   senders end-to-end on a test account before enabling (`CASTORA_ENABLE_SCHEDULED_SENDER` + cron).
4. **Tech debt:** dedupe `react-query` v3 → `@tanstack/react-query` v5; plan Next.js 13.5 → 15/16;
   re-enable `reactStrictMode` + ESLint-on-build (both "todo" in `next.config.js`).

**Live browser debugging:** you can drive Chrome via CDP without an MCP — launch a debuggable
instance (`open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=<dir>
--disable-features=ThirdPartyStoragePartitioning,TrackingProtection3pcd`) and talk to it with a small
`ws`-based script (Chrome 148 blocks debugging the default profile, so use a separate `--user-data-dir`).
- Other tech debt: two query libs coexist (`react-query` v3 + `@tanstack/react-query` v5 — converge);
  Next.js is 13.5 (upgrade path to 15/16); `reactStrictMode` and ESLint-on-build are disabled (`next.config.js`, "todo switch back").

## Deploy & verify

- Deploy happens automatically on merge to `main`. To check: Vercel project
  `prj_h4VzZir37pMPnqBTeuQhDDd0ZNAE` / team `arcas-projects-d844d101`. A deploy is healthy when the
  production deployment reaches `Ready` and is attributed to `arcabot`/`arca22775@gmail.com`.
