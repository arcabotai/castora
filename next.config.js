const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  reloadOnOnline: true,
  buildExcludes: [/middleware-manifest.json$/],
  customWorkerDir: 'worker',
  additionalManifestEntries: [
    { url: process.env.NODE_ENV === 'development' ? '/worker-development.js' : '/worker.js', revision: Date.now().toString() }
  ],
  // Keep first production deploys boring. The inherited PWA worker is
  // memory-heavy during build and is not required for Castora's launch shell.
  // Re-enable with CASTORA_ENABLE_PWA=true once the full client wiring is ready.
  disable: process.env.NODE_ENV === 'development' || process.env.CASTORA_ENABLE_PWA !== 'true'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // todo switch back to true until the accounts situation is resolved
  reactStrictMode: false,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    // todo switch back when i have time
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['pbs.twimg.com', 'video.twimg.com', 'images.ctfassets.net', 'gateway.pinata.cloud', 'supercast.mypinata.cloud', 'imagedelivery.net'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = withPWA(nextConfig)
