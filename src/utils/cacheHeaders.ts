type PublicCacheOptions = {
  browserMaxAge?: number
  cdnMaxAge?: number
  staleWhileRevalidate?: number
}

export const privateCacheHeaders: HeadersInit = {
  "Cache-Control": "private, max-age=0, no-store",
}

export function publicCacheHeaders({
  browserMaxAge = 60,
  cdnMaxAge = 300,
  staleWhileRevalidate = 3600,
}: PublicCacheOptions = {}): HeadersInit {
  const cdnValue = `max-age=${cdnMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`

  return {
    "Cache-Control": `public, max-age=${browserMaxAge}`,
    "CDN-Cache-Control": cdnValue,
    "Vercel-CDN-Cache-Control": cdnValue,
  }
}
