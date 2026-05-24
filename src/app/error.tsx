'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="pt-16 px-6">
      <img src="/superdog.avif" alt="Error" className="mx-auto shadow-sm rounded-md sm:w-[600px]" />
      <h1 className="text-3xl text-center mt-4">Woof. Super broke.</h1>
      <p className="text-center mt-2">We are tracking this problem. To help us fix it faster, report it on <a href="/channel/super" className="underline">/super</a> or in the telegram community.</p>
    </div>
  )
}