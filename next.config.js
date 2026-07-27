// Cache par défaut de next-pwa : couvre polices, images, JS, CSS, et surtout
// les pages elles-mêmes (règle "others", requêtes de navigation) — c'est ce
// qui permet d'OUVRIR l'app sans réseau, pas seulement de lire ses données.
// Ne JAMAIS remplacer ce tableau par une liste personnalisée sans le fusionner :
// next-pwa écrase, il ne complète pas.
const runtimeCaching = require('next-pwa/cache')

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // Le pull complet des données doit toujours essayer le réseau d'abord
    // (données fraîches), mais échouer vite s'il n'y a pas de connexion —
    // pullToutesLesDonnees() gère déjà lui-même l'échec proprement.
    {
      urlPattern: /\/api\/sync\/pull/,
      handler: 'NetworkOnly',
      options: {},
    },
    ...runtimeCaching,
  ],
  // Si une page jamais visitée en ligne est demandée hors connexion (lien
  // profond, favori), on retombe sur le tableau de bord plutôt que sur
  // l'écran d'erreur du navigateur.
  fallbacks: {
    document: '/admin/dashboard',
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client'],
  },
}

module.exports = withPWA(nextConfig)
