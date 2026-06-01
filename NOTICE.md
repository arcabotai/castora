# Castora Notice

Castora is maintained by Arca as an independent Farcaster client.

The current codebase is derived from the public `felirami/supercast-dump`
repository and still contains inherited Supercast-era routes, Prisma models,
components, migrations, and naming. That provenance is documented openly so
contributors and reviewers understand what is Castora-owned product work and
what still needs rebrand, audit, or removal.

Public EVM contract addresses, token addresses, and similar onchain identifiers
may appear in source code and are not secrets. Runtime credentials, API keys,
database URLs, webhook secrets, private keys, and service tokens must stay out
of git and belong only in local or hosted environment variables.
