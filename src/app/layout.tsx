import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "./AppProviders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://castora-tan.vercel.app"),
  title: "Castora",
  description: "Castora: a Farcaster client bootstrapped by Arca.",
  manifest: "/manifest.json",
  icons: {
    apple: "/supercast-logo-white.png",
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
  openGraph: {
    title: "Castora",
    description: "Castora: a Farcaster client bootstrapped by Arca.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://castora-tan.vercel.app",
    siteName: "Castora",
    images: [
      {
        url: "/supercast-logo-black.png",
        width: 512,
        height: 512,
        alt: "Castora",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white text-gray-950 dark:bg-gray-950 dark:text-gray-50 font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
