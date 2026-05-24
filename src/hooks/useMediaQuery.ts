import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  // Set initial state by checking the media query
  const [matches, setMatches] = useState(() =>
    window.matchMedia(query).matches
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    // Update matches when media query changes
    const updateMatches = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }
    // Modern event listener API
    media.addEventListener('change', updateMatches)
    // Set initial value in case it changed between render and effect
    setMatches(media.matches)
    // Cleanup
    return () => {
      media.removeEventListener('change', updateMatches)
    }
  }, [query]) // Only re-run if query changes

  return matches
}