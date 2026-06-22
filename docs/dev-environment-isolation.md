# Isolating the dev environment (separate DB + Privy app)

> **Status: PLAN, not yet done.** Today the Vercel **Development**, **Preview**, and
> **Production** environments all use the **same Railway Postgres DB** and the **same
> Privy app**, so `npm run dev` locally reads/writes **live production data**. This
> runbook stands up an isolated dev environment so local work can't touch prod. It's
> the #2 item on the hardening roadmap.

No application code changes are required — isolation is entirely env-var driven
(`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `NEXT_PUBLIC_PRIVY_APP_ID`,
`PRIVY_SECRET_KEY`). The Prisma datasource already reads those two Postgres URLs
(`src/prisma/schema.prisma`), and `src/providers/PrivyProvider.tsx` reads the Privy
app id from env (with a hardcoded **prod** fallback — so the dev id MUST be set).

## Cost / risk

- A new Railway Postgres is **billable** (~$7–10/mo, Hobby tier).
- Changing the **Preview** scope affects all preview deploys — decide the strategy below.
- **Never** run migrations against the existing (prod) DB from local. Apply schema
  only to the **new** dev DB, using its connection string.

---

## Part 1 — Manual dashboard steps (human)

### 1.1 Create a dev Railway Postgres
1. Railway dashboard → the Castora project → **+ Create → Database → PostgreSQL**.
2. Name it `castora-dev`.
3. Copy its two connection strings:
   - **pooled** → `POSTGRES_PRISMA_URL`
   - **direct / non-pooling** → `POSTGRES_URL_NON_POOLING`

A fresh DB has zero data and an empty migration history (this is expected).

### 1.2 Create a dev Privy app
1. Privy dashboard → **Create app** → name `Castora Dev`.
2. Mirror the prod app's login methods (email / Farcaster / wallet).
3. **Configuration → App settings → Domains → Allowed origins**: add
   `http://localhost:3000` (and any dev preview domain you'll use).
4. Copy the **App ID** (`NEXT_PUBLIC_PRIVY_APP_ID`) and **App secret** (`PRIVY_SECRET_KEY`).

> The prod app id (`cmpke74en…`) is locked to prod origins — do **not** reuse it. Its
> custom auth domain `privy.castora.social` is prod-only; the dev app uses Privy's
> default domain, which is still cross-site, so the 3rd-party-cookie note in AGENTS.md
> still applies for local login.

---

## Part 2 — CLI / code steps (once the values from Part 1 exist)

### 2.1 Set Vercel **Development** env vars
In Vercel → `arcas-projects-d844d101/castora` → Settings → Environment Variables,
set these in the **Development** scope only (leave Production untouched):

| Variable | Value |
| --- | --- |
| `POSTGRES_PRISMA_URL` | dev pooled URL (1.1) |
| `POSTGRES_URL_NON_POOLING` | dev direct URL (1.1) |
| `NEXT_PUBLIC_PRIVY_APP_ID` | dev app id (1.2) |
| `PRIVY_SECRET_KEY` | dev app secret (1.2) |

Other vars (Neynar, Stripe, etc.) can stay shared. `REDIS_URL` can be reused (Redis
is optional and fails open) or pointed at a separate dev instance.

### 2.2 Preview strategy — pick one
- **A (recommended): Preview → dev.** Set the same 4 dev vars in the **Preview** scope.
  Preview deploys then hit dev data; only Production is on prod.
- **B: Preview → prod (status quo).** Leave Preview unchanged; only local dev is isolated.

### 2.3 Pull dev env locally + apply schema to the **fresh** dev DB
```bash
cd /Users/felirami/castora
vercel env pull .env.local --environment=development --yes
# localhost override (pull resets these to prod):
printf '\nNEXT_PUBLIC_APP_URL=http://localhost:3000\nNEXT_PUBLIC_URL=http://localhost:3000\n' >> .env.local

# Prisma CLI reads .env, not .env.local — load it, then CONFIRM you're on the dev DB:
set -a; . ./.env.local; set +a
echo "$POSTGRES_URL_NON_POOLING"   # MUST be the castora-dev URL, not prod

# Apply the schema to the empty dev DB:
npx prisma migrate deploy --schema=./src/prisma/schema.prisma
```
> **Migration caveat:** prod has a known re-baseline artifact (2 migrations show "not
> yet applied" with earlier dates — see AGENTS.md). On a *fresh* DB `migrate deploy`
> should apply the full history cleanly; if the ordering trips it, fall back to
> `npx prisma db push --schema=./src/prisma/schema.prisma` for the dev DB (schema
> fidelity matters more than history there). Either way, **only** against the dev URL.

```bash
npm run prisma:generate
npm run dev   # http://localhost:3000 — sign in with a throwaway Privy account
```

### 2.4 Verify isolation
Create a bookmark / list / draft locally, then confirm it does **not** appear on
castora.social. Data should live only in `castora-dev`.

---

## Part 3 — Docs to update once isolation is live
- **AGENTS.md** — replace the "⚠️ Environments are NOT isolated" section with the new
  reality (Development isolated; Production separate), and drop the "treat the local
  window as castora.social" warning.
- **`.env.example`** — note dev-vs-prod values come from `vercel env pull --environment`.

## Rollback
Delete the `castora-dev` Railway DB + `Castora Dev` Privy app, and revert the Vercel
Development scope to the prod values. No code changes to undo.
