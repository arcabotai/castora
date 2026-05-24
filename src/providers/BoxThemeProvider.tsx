'use client'

import "@decent.xyz/the-box/index.css";
import { BoxThemeProvider as DecentBoxThemeProvider } from "@decent.xyz/the-box";
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const lightTheme = {
  "mainBgColor": "#fff",
  "mainTextColor": "#111827",
  "tokenSwapCardBgColor": "#fff",
  "buyBtnBgColor": "#111827",
  "buyBtnTextColor": "#fff",
  "switchBtnBgColor": "#fff",
  "tokenDialogHoverColor": "#fff",
  "boxSubtleColor1": "#999999",
  "borderColor": "#e5e7eb",
  "loadShineColor1": "#121212",
  "loadShineColor2": "#333333",
  "greenBadgeTextColor": "#11BC91",
  "greenBadgeBgColor": "#123129",
  "yellowBadgeTextColor": "#FF8B31",
  "yellowBadgeBgColor": "#ca9e00",
  "circleLinkChainColor": "#9969FF",
  "circleLinkBgColor": "#261D3C",
  "borderRadius": "8px",
  "buyBtnBorderRadius": "8px"
}

const darkTheme = {
  "mainBgColor": "#111827",
  "mainTextColor": "#e0e0e0",
  "tokenSwapCardBgColor": "#1e293b",
  "buyBtnBgColor": "#3a3a3a",
  "buyBtnTextColor": "#ffffff",
  "switchBtnBgColor": "#3a3a3a",
  "tokenDialogHoverColor": "#3a3a3a",
  "boxSubtleColor1": "#666666",
  "borderColor": "#444444",
  "loadShineColor1": "#1e293b",
  "loadShineColor2": "#3a3a3a",
  "greenBadgeTextColor": "#11BC91",
  "greenBadgeBgColor": "#0a1a17",
  "yellowBadgeTextColor": "#FF8B31",
  "yellowBadgeBgColor": "#3d2f00",
  "circleLinkChainColor": "#9969FF",
  "circleLinkBgColor": "#1a1428",
  "borderRadius": "8px",
  "buyBtnBorderRadius": "8px"
}

export function BoxThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()

  const currentTheme = resolvedTheme === 'dark' ? darkTheme : lightTheme

  return (
    <DecentBoxThemeProvider theme={currentTheme}>
      {children}
    </DecentBoxThemeProvider>
  );
}