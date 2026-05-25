import { usePrivy } from '@privy-io/react-auth';
import { Button } from './ui/button';
import Footer from './Footer';
import Image from 'next/image';
import { useSuperLogin } from '@/hooks/useSuperLogin';
import DebugState from './debug/DebugState';

export default function LandingPage() {
  const { ready } = usePrivy();
  const { login } = useSuperLogin();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white text-gray-950 dark:bg-gray-950 dark:text-white">
      <DebugState />
      <main className="relative flex min-h-[calc(100vh-88px)] flex-grow items-center overflow-hidden">
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
          className="object-cover object-top opacity-20 dark:opacity-25 md:hidden"
        />
        <div className="absolute inset-0 bg-white/82 dark:bg-gray-950/84" aria-hidden="true" />

        <div className="relative z-10 mx-auto w-full max-w-5xl px-5 py-16 sm:px-8">
          <div className="mb-7 flex items-center gap-3">
            <img
              src="/castora-mark.svg"
              alt="Castora mark"
              className='h-9 w-9'
            />
            <span className="text-2xl font-bold tracking-normal text-gray-950 dark:text-white">
              Castora
            </span>
          </div>

          <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] tracking-normal text-gray-950 dark:text-white sm:text-6xl">
            Castora
          </h1>
          <p className="mt-5 max-w-xl text-lg font-medium leading-7 text-gray-700 dark:text-gray-200 sm:text-xl">
            A sharper Farcaster client for fast feeds, serious compose, cleaner profiles, and social workflows built with Arca.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size='xl'
              className='h-12 w-full max-w-xs font-semibold sm:w-auto sm:px-8'
              onClick={login}
              disabled={!ready}
            >
              Get started
            </Button>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Web-first beta. Installable as a PWA.
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
