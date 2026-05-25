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
      <img src="/castora-mark.svg" alt="Error" className="mx-auto shadow-sm rounded-md sm:w-[600px]" />
      <h1 className="text-3xl text-center mt-4">Castora hit a snag.</h1>
      <p className="text-center mt-2">We are tracking this problem. To help us fix it faster, try again in a moment or ping Arca with what you were doing.</p>
    </div>
  )
}