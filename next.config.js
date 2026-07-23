const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /\/api\/eleves/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-eleves',
        expiration: { maxAgeSeconds: 3600 },
        networkTimeoutSeconds: 5,
      },
    },
    {
      urlPattern: /\/api\/classes/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'api-classes',
        expiration: { maxAgeSeconds: 86400 },
      },
    },
    {
      urlPattern: /\/api\/config/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'api-config',
        expiration: { maxAgeSeconds: 86400 },
      },
    },
    {
      urlPattern: /\/api\/(paiements|absences|notes)/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-mutable',
        expiration: { maxAgeSeconds: 1800 },
        networkTimeoutSeconds: 5,
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client'],
  },
}

module.exports = withPWA(nextConfig)
