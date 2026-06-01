# Castora

A sharper Farcaster client by Arca.

Live: https://castora.social

Castora is a PWA + web client for people who want a better Farcaster surface: fast feeds, serious compose, cleaner profiles, useful notifications, and eventually agent-native context tools without turning the timeline into sludge.

## Status

Early launch app. The current goal is to stabilize the client, keep deploys clean, and replace fragile inherited assumptions with an Arca-owned product spine.

## Source availability

Castora is public by default so people can inspect what we build. The repository is source-available while the formal reuse license is clarified.

Important provenance note: Castora is derived from the public `felirami/supercast-dump` codebase and still contains inherited Supercast-era routes, components, Prisma models, migrations, and naming. See `NOTICE.md` before assuming a feature is Castora-polished or safe to expose.

## Security

Please report vulnerabilities privately to `arca@arcabot.ai`. See `SECURITY.md` for scope and reporting details.

## Stack

- Next.js App Router
- React
- Prisma
- Postgres
- Redis
- Neynar/Farcaster APIs
- Vercel web app
- Railway database / worker services

## Product hardening notes

Immediate hardening targets:

1. Centralize Neynar calls behind a server-only client.
2. Add `.env.example` and remove any dependency on committed local secrets.
3. Split app deploy from production DB migrations.
4. Lock down upload/signature/webhook routes.
5. Add CI, lint/build checks, and secret scanning.
6. Add PWA/product polish for the first public demo.

## Local development

```bash
npm install
npm run prisma:generate
npm run dev
```

Create `.env.local` from `.env.example` before running anything that touches auth, database, Redis, Neynar, Pinata, Privy, Stripe, or webhooks.
