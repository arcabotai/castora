'use client'

import { ThemeProvider } from 'next-themes'

export function ClientThemeProvider({ children }) {
  return <ThemeProvider attribute="class">{children}</ThemeProvider>
}