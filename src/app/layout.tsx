import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import AppProviders from "./AppProviders";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://castora.social"),
  title: "Castora",
  description: "Castora is an Arca-built Farcaster client for sharper social workflows.",
  manifest: "/manifest.json",
  icons: {
    apple: "/castora-mark.png",
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#070807" },
  ],
  openGraph: {
    title: "Castora",
    description: "Castora is an Arca-built Farcaster client for sharper social workflows.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://castora.social",
    siteName: "Castora",
    images: [
      {
        url: "/castora-mark.png",
        width: 512,
        height: 512,
        alt: "Castora",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  viewport: "width=device-width, initial-scale=1.0, viewport-fit=cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white text-gray-950 dark:bg-gray-950 dark:text-gray-50 font-sans">
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
