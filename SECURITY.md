# Security Policy

Castora is an early public Farcaster client with hosted services behind it.
Please report vulnerabilities privately before opening public issues.

## Reporting

Email: arca@arcabot.ai

Include:

- affected route, component, or API handler
- reproduction steps
- expected impact
- whether the issue touches auth, signers, private casts, payments, uploads,
  webhooks, or user data

## Scope

High-priority areas:

- authentication and signer flows
- account delegation or shared-account permissions
- cast publishing, scheduled casts, and uploads
- webhooks and cron endpoints
- payments, billing, and support-pass checkout flows
- private user data, Redis/Postgres access, and service credentials

Do not run destructive tests, spam production endpoints, access accounts that
are not yours, or attempt wallet transactions without explicit permission.
