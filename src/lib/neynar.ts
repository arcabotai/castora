import axios from 'axios'

/**
 * Server-only Neynar API client.
 *
 * Centralizes the Neynar base URL and API key so route handlers and server
 * utilities never hardcode `https://api.neynar.com` or read `NEYNAR_API_KEY`
 * directly. Use relative paths against it:
 *
 *   import { neynar } from '@/lib/neynar'
 *   const res = await neynar.get(`/v2/farcaster/user/bulk/?fids=${fids}`)
 *
 * IMPORTANT: server-only. This carries the secret API key — never import it
 * into a Client Component. (NEYNAR_API_KEY is not a NEXT_PUBLIC_ var, so it is
 * only defined on the server; a stray client import would send no key at all.)
 */
export const NEYNAR_BASE_URL = 'https://api.neynar.com'

export const neynar = axios.create({
  baseURL: NEYNAR_BASE_URL,
  headers: {
    'x-api-key': process.env.NEYNAR_API_KEY ?? '',
  },
})
