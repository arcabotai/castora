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
- Login is via **Privy**. For localhost login to work, `http://localhost:3000` must be in the Privy
  app's allowed origins (dashboard → Configuration → App settings → Domains).
- Unauthenticated API routes returning `401`/`403` is expected (auth gates), not a crash.

## CI (`.github/workflows/ci.yml`)

- **Hard gate:** `typecheck` + `build`. **Non-blocking:** `lint` (project sets `eslint.ignoreDuringBuilds`).
- **Secret scan:** gitleaks. `.gitleaks.toml` allowlists `0x…` EVM addresses (public, not secrets);
  add narrow allowlist entries for other confirmed false positives — never disable the scan.

## Roadmap / known work

- **Disabled workers (`src/scripts/*` were never in this fork).** Five routes are gated stubs that
  return `501 "...disabled in Castora bootstrap"`: `index-superanon-scores-from-dune`,
  `cancel-expired-subscriptions`, `send-expiration-reminders`, `cast/send-scheduled`,
  `cast/send-scheduled-drafts`. Re-enabling means reconstructing the modules (send logic exists in
  `@/utils/drafts`). The cron auth + `CRON_SECRET` (set in Vercel prod/dev) are already in place.
  Be careful: these post casts / cancel Stripe subscriptions / send DMs — test behind a flag, and
  only add to `vercel.json` crons with explicit sign-off.
  - **`index-superanon-scores-from-dune` is SHELVED** (kept, not removed). Superanon was a
    Supercast-only feature; its account `@superanon` (fid 862100) has been dormant since
    2025-10-28 and the Dune query was never in this fork, so there is no live data to index. The
    anon-posting idea lives on independently as Anoncast / Anon World ($ANON). Removed from
    vercel.json crons. Do NOT reconstruct unless a live scoring source returns. The leaderboard
    routes + `SuperanonScore` model + `NEXT_PUBLIC_SUPERANON_FID` are dormant legacy.
  - **Direct Casts (DMs):** `@/utils/direct-casts.ts` sends via `api.warpcast.com/v2/ext-send-direct-cast`
    with a Farcaster app API key (`WARPCAST_DM_API_KEY` — rename to `FARCASTER_DM_*` when wiring it).
    Send-only and account-bound; there is no official read/receive DM API, so full native DM parity
    inside Castora is not feasible today. Fine for one-off sends like expiration reminders.
- Other tech debt: two query libs coexist (`react-query` v3 + `@tanstack/react-query` v5 — converge);
  Next.js is 13.5 (upgrade path to 15/16); `reactStrictMode` and ESLint-on-build are disabled (`next.config.js`, "todo switch back").

## Deploy & verify

- Deploy happens automatically on merge to `main`. To check: Vercel project
  `prj_h4VzZir37pMPnqBTeuQhDDd0ZNAE` / team `arcas-projects-d844d101`. A deploy is healthy when the
  production deployment reaches `Ready` and is attributed to `arcabot`/`arca22775@gmail.com`.
