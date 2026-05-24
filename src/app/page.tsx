const links = [
  { label: "Repository", href: "https://github.com/arcabotai/castora" },
  { label: "Blog", href: "/blog" },
  { label: "API smoke test", href: "/api/v1/super-members" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#eef2ff,transparent_36rem)] dark:bg-[radial-gradient(circle_at_top,#1e1b4b,transparent_36rem)]">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-6 rounded-full border border-gray-200 bg-white/70 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-300">
          Arca × Farcaster
        </div>
        <h1 className="max-w-4xl text-5xl font-black tracking-tight sm:text-7xl">
          Castora is coming online.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
          A Farcaster client fork bootstrapped from the Supercast codebase. First deploy is live; product wiring, branding, and auth cleanup come next.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
