import { usePrivy } from '@privy-io/react-auth';
import { Button } from './ui/button';
import Footer from './Footer';
import Image from 'next/image';
import { useSuperLogin } from '@/hooks/useSuperLogin';
import DebugState from './debug/DebugState';

const workflowHighlights = [
  {
    label: 'Feed',
    title: 'Read faster',
    copy: 'Dense Farcaster feeds, clean embedded media, and fewer distractions when you are scanning a live conversation.',
  },
  {
    label: 'Compose',
    title: 'Post with control',
    copy: 'A sharper composer for serious publishing, replies, profile context, and repeat social workflows.',
  },
  {
    label: 'Mobile',
    title: 'Works on the phone',
    copy: 'Responsive navigation, installable PWA behavior, and touch-safe layouts for quick checks away from desktop.',
  },
];

export default function LandingPage() {
  const { ready } = usePrivy();
  const { login } = useSuperLogin();

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-950 dark:bg-gray-950 dark:text-white">
      <DebugState />
      <main>
        <section className="relative isolate flex min-h-[78svh] items-center overflow-hidden border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
          <Image
            src="/landing-page-ss.png"
            alt="Castora feed preview"
            fill
            priority
            sizes="100vw"
            className="hidden object-cover object-top opacity-20 dark:opacity-25 md:block"
          />
          <Image
            src="/landing-page-ss-mobile.png"
            alt="Castora mobile feed preview"
            fill
            priority
            sizes="100vw"
            className="object-cover object-top opacity-[0.18] dark:opacity-25 md:hidden"
          />
          <div className="absolute inset-0 bg-white/86 dark:bg-gray-950/86" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-gray-950 dark:via-gray-950/80" aria-hidden="true" />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
            <div className="mb-8 flex items-center gap-3">
              <img
                src="/castora-mark.svg"
                alt="Castora mark"
                className='h-10 w-10 shrink-0'
              />
              <span className="text-2xl font-bold tracking-normal text-gray-950 dark:text-white">
                Castora
              </span>
            </div>

            <div className="max-w-3xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                Farcaster client by Arca
              </p>
              <h1 className="text-5xl font-bold leading-[1.02] tracking-normal text-gray-950 dark:text-white sm:text-6xl lg:text-7xl">
                Castora
              </h1>
              <p className="mt-5 max-w-2xl text-lg font-medium leading-7 text-gray-700 dark:text-gray-200 sm:text-xl">
                A sharper Farcaster client for fast feeds, serious compose, cleaner profiles, and social workflows built with Arca.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size='xl'
                className='h-12 w-full max-w-xs font-semibold sm:w-auto sm:px-8'
                onClick={login}
                disabled={!ready}
              >
                Get started
              </Button>
              <span className="max-w-xs text-sm font-medium leading-5 text-gray-500 dark:text-gray-400 sm:max-w-none">
                Web-first beta. Installable as a PWA.
              </span>
            </div>

            <div className="mt-10 grid max-w-3xl grid-cols-1 gap-2 sm:grid-cols-3">
              {['Fast feeds', 'Clean compose', 'Mobile-ready'].map((item) => (
                <div
                  key={item}
                  className="border border-gray-200 bg-white/72 px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/72 dark:text-gray-100"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 px-5 py-12 dark:bg-gray-900/45 sm:px-8 lg:py-16">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
            {workflowHighlights.map((item) => (
              <article
                key={item.title}
                className="border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  {item.label}
                </p>
                <h2 className="mt-3 text-xl font-bold tracking-normal text-gray-950 dark:text-white">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
