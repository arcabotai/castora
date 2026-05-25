import { usePrivy } from '@privy-io/react-auth';
import { Button } from './ui/button';
import Footer from './Footer';
import Image from 'next/image';
import { useSuperLogin } from '@/hooks/useSuperLogin';
import DebugState from './debug/DebugState';
import { ArrowRight, CheckCircle2, Layers3, Radio, Smartphone, Sparkles } from 'lucide-react';

const workflowHighlights = [
  {
    label: 'Feed',
    title: 'Read faster',
    copy: 'Dense casts, readable threads, tweet embeds, and media previews tuned for quick scanning.',
    icon: Radio,
  },
  {
    label: 'Compose',
    title: 'Post with control',
    copy: 'A cleaner publishing surface for drafts, replies, profile context, and repeat workflows.',
    icon: Layers3,
  },
  {
    label: 'Mobile',
    title: 'Built for the pocket check',
    copy: 'Touch-safe navigation, installable PWA behavior, and layouts that keep scrolling predictable.',
    icon: Smartphone,
  },
];

const productNotes = [
  'Arca-maintained Farcaster client',
  'Web-first beta with PWA install',
  'Cleaner embeds and Castora branding',
];

export default function LandingPage() {
  const { ready } = usePrivy();
  const { login } = useSuperLogin();

  return (
    <div className="min-h-svh overflow-x-hidden bg-[#f7f8f6] text-[#111210] dark:bg-[#070807] dark:text-white">
      <DebugState />
      <main>
        <section className="relative isolate flex min-h-[88svh] flex-col overflow-hidden border-b border-black/10 bg-[#f7f8f6] dark:border-white/10 dark:bg-[#070807]">
          <Image
            src="/landing-page-ss.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="hidden object-cover object-top opacity-[0.16] saturate-[0.82] dark:opacity-[0.22] md:block"
          />
          <Image
            src="/landing-page-ss-mobile.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-top opacity-[0.14] saturate-[0.86] dark:opacity-[0.2] md:hidden"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(16,185,129,0.24),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(249,115,22,0.16),transparent_24%),linear-gradient(120deg,rgba(247,248,246,0.96),rgba(247,248,246,0.78)_48%,rgba(247,248,246,0.95))] dark:bg-[radial-gradient(circle_at_22%_24%,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(249,115,22,0.12),transparent_24%),linear-gradient(120deg,rgba(7,8,7,0.96),rgba(7,8,7,0.82)_48%,rgba(7,8,7,0.96))]" aria-hidden="true" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(17,18,16,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(17,18,16,0.055)_1px,transparent_1px)] bg-[size:38px_38px] opacity-55 dark:bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)]" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f7f8f6] via-[#f7f8f6]/82 to-transparent dark:from-[#070807] dark:via-[#070807]/82" aria-hidden="true" />

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8 lg:px-10">
            <header className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/castora-mark.svg"
                  alt="Castora mark"
                  className="h-10 w-10 shrink-0"
                />
                <span className="text-xl font-black tracking-normal text-[#111210] dark:text-white">
                  Castora
                </span>
              </div>
              <Button
                variant="outline"
                className="h-10 border-black/15 bg-white/72 px-4 text-sm font-bold text-[#111210] shadow-sm backdrop-blur hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                onClick={login}
                disabled={!ready}
              >
                Sign in
              </Button>
            </header>

            <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] lg:py-16">
              <div className="max-w-3xl">
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-400/12 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-200">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Farcaster client by Arca
                </p>
                <h1 className="text-5xl font-black leading-[0.98] tracking-normal text-[#111210] dark:text-white sm:text-6xl lg:text-7xl">
                  Castora
                </h1>
                <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-[#3d403a] dark:text-white/78 sm:text-xl">
                  A sharper Farcaster workspace for fast reading, cleaner publishing, profile context, and mobile checks that do not fight the page.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    size="xl"
                    className="h-12 w-full max-w-xs gap-2 rounded-full bg-[#111210] text-base font-black text-white shadow-[0_18px_50px_rgba(17,18,16,0.24)] hover:bg-black dark:bg-white dark:text-[#111210] dark:hover:bg-white/90 sm:w-auto sm:px-8"
                    onClick={login}
                    disabled={!ready}
                  >
                    Get started
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <span className="max-w-xs text-sm font-semibold leading-5 text-[#5c6158] dark:text-white/58 sm:max-w-none">
                    Web beta. PWA-ready. Built from the Supercast base.
                  </span>
                </div>

                <ul className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                  {productNotes.map((note) => (
                    <li
                      key={note}
                      className="flex min-h-14 items-center gap-2 border-l-2 border-emerald-500/60 bg-white/58 px-3 py-2 text-sm font-bold leading-5 text-[#2f332d] shadow-sm backdrop-blur dark:border-emerald-300/60 dark:bg-white/[0.07] dark:text-white/82"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
                      {note}
                    </li>
                  ))}
                </ul>

                <div className="mt-9 lg:hidden">
                  <div className="mx-auto max-w-[19rem] overflow-hidden rounded-[2rem] border-[6px] border-[#111210] bg-[#111210] shadow-[0_24px_70px_rgba(17,18,16,0.3)] dark:border-white dark:bg-white">
                    <div className="relative aspect-[9/16]">
                      <Image
                        src="/landing-page-ss-mobile.png"
                        alt="Castora mobile feed preview"
                        fill
                        sizes="304px"
                        className="object-cover object-top"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative hidden min-h-[520px] lg:block">
                <div className="absolute inset-x-0 top-8 h-[390px] rotate-[-2deg] overflow-hidden border border-black/10 bg-white shadow-[0_30px_90px_rgba(17,18,16,0.22)] dark:border-white/10 dark:bg-[#10120f]">
                  <Image
                    src="/landing-page-ss.png"
                    alt="Castora desktop feed preview"
                    fill
                    sizes="42vw"
                    className="object-cover object-top"
                  />
                </div>
                <div className="absolute bottom-0 right-4 h-[430px] w-[198px] rotate-[4deg] overflow-hidden rounded-[2rem] border-[6px] border-[#111210] bg-[#111210] shadow-[0_28px_80px_rgba(17,18,16,0.32)] dark:border-white dark:bg-white">
                  <Image
                    src="/landing-page-ss-mobile.png"
                    alt="Castora mobile feed preview"
                    fill
                    sizes="198px"
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-20 -mt-6 px-5 pb-12 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 md:grid-cols-3">
            {workflowHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="min-h-48 border border-black/10 bg-white p-5 shadow-[0_20px_60px_rgba(17,18,16,0.08)] dark:border-white/10 dark:bg-[#10120f]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6c7167] dark:text-white/48">
                      {item.label}
                    </p>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111210] text-white dark:bg-white dark:text-[#111210]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <h2 className="mt-5 text-2xl font-black tracking-normal text-[#111210] dark:text-white">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm font-medium leading-6 text-[#5c6158] dark:text-white/62">
                    {item.copy}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="px-5 pb-16 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-8 border-y border-black/10 py-12 dark:border-white/10 lg:grid-cols-[0.72fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700 dark:text-orange-300">
                Public beta surface
              </p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-normal text-[#111210] dark:text-white sm:text-4xl">
                Fast enough for the daily feed, restrained enough for actual work.
              </h2>
              <p className="mt-4 text-base font-medium leading-7 text-[#555a51] dark:text-white/62">
                Castora keeps the Supercast-style power-user base while cleaning up the public entry point, branding, embeds, and phone layout for the arcabot.ai deployment.
              </p>
            </div>
            <div className="relative overflow-hidden border border-black/10 bg-white shadow-[0_24px_70px_rgba(17,18,16,0.12)] dark:border-white/10 dark:bg-[#10120f]">
              <div className="flex items-center gap-2 border-b border-black/10 px-4 py-3 dark:border-white/10">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="relative aspect-[16/10]">
                <Image
                  src="/landing-page-ss2.png"
                  alt="Castora conversation interface preview"
                  fill
                  sizes="(min-width: 1024px) 54vw, 100vw"
                  className="object-cover object-top"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
