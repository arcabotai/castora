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
  disable: process.env.NODE_ENV === 'development'
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
    domains: ['pbs.twimg.com', 'video.twimg.com', 'images.ctfassets.net', 'supercast.mypinata.cloud', 'imagedelivery.net'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = withPWA(nextConfig)
