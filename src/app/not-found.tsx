import React from 'react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">This user does not exist</h2>
      <Link href="/" className="text-gray-500 hover:underline">
        Return home
      </Link>
    </div>
  )
}