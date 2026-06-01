# Contributing to Castora

Castora is becoming public before every inherited surface has been polished.
That is intentional: the project should be auditable while the product matures.

Before working on roadmap or feature reactivation, read:

- `README.md`
- `NOTICE.md`

## Development

```bash
npm install
npm run prisma:generate
npm run typecheck
```

Create `.env.local` from `.env.example`. Never commit real credentials.

## Good First Areas

- Castora rebrand cleanup where Supercast-era naming is still visible
- empty, loading, and error states for Bookmarks, Lists, Drafts, and Scheduled
- docs that clarify env requirements and self-hosting limits
- tests or checks around auth, uploads, webhooks, and scheduling

## Pull Requests

Keep pull requests small and focused. Include:

- what changed
- how it was tested
- screenshots for visible UI changes
- any new env variables or operational risks

Avoid exposing anonymous/shared-signer features, Direct Cast helpers, public
APIs, webhooks, wallet-affecting flows, or paid features without a specific
security and product review.
