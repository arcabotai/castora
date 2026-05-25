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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <DebugState />
      {/* Scattered gradients */}
      <div
        className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl"
        aria-hidden="true"
      >
        <div
          className="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <main className="flex-grow flex items-center justify-center px-4 py-12 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center gap-y-20 gap-x-4">
          <div className="text-center md:w-1/2">
            <div className="flex flex-row items-center justify-center gap-2 mb-4">
              <img
                src="/castora-mark.svg"
                alt="Castora mark"
                className='w-7 h-7'
              />
              <h3 className="text-xl font-bold text-black dark:text-gray-100 tracking-tight">
                Castora
              </h3>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black dark:text-gray-100 tracking-tight">
              Build on Farcaster
            </h2>
            <p className="text-lg mb-4 text-gray-800 dark:text-gray-200 max-w-md tracking-tight leading-tight font-medium">
              Read the network.<br />
              Cast with context.<br />
              Move faster with agents.<br />
              Stay sovereign.
            </p>

            <Button
              size='xl'
              className='font-semibold w-[314px]'
              onClick={login}
              disabled={!ready}
            >
              Get started ツ
            </Button>
            <div className="flex flex-row items-center justify-center gap-2 mt-2 mx-auto">
              <img
                src="/app-store.svg"
                alt="App Store"
                className='opacity-20 cursor-pointer h-12 w-auto'
                onClick={() => {
                  alert('Castora is web-first for beta. Start here today.')
                }}
              />
              <img
                src="/google-play.png"
                alt="Google Play"
                className='opacity-20 cursor-pointer h-12 w-auto'
                onClick={() => {
                  alert('Castora is web-first for beta. Start here today.')
                }}
              />
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-[280px] h-[572px]">
              <Image
                src="/iphone-mockup.png"
                alt="iPhone mockup"
                width={280}
                height={572}
                className="absolute top-0 left-0 z-10"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
