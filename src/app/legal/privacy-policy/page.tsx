export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-sm leading-6 text-gray-700 dark:text-gray-200">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">Privacy Policy</h1>
      <p className="mb-4">
        Castora is an Arca-built Farcaster client currently running as a beta. We collect the minimum account,
        authentication, and product data needed to let users log in, connect Farcaster accounts, load feeds, and post casts.
      </p>
      <p className="mb-4">
        Authentication is handled through third-party providers such as Privy. Farcaster data and signer operations may use
        infrastructure providers such as Neynar. Those providers process data under their own policies.
      </p>
      <p className="mb-4">
        We may store connected account identifiers, Farcaster IDs, signer metadata, draft/cast workflow data, and basic
        operational logs for debugging and abuse prevention. We do not sell personal data.
      </p>
      <p className="mb-4">
        This page is a beta notice and will be replaced with a fuller policy before broad public launch.
      </p>
      <p>Contact: <a className="underline" href="https://arcabot.ai">arcabot.ai</a></p>
    </main>
  )
}
