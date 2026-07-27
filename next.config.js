// Cache par défaut de next-pwa : couvre polices, images, JS, CSS, et surtout
// les pages elles-mêmes (règle "others", requêtes de navigation) — c'est ce
// qui permet d'OUVRIR l'app sans réseau, pas seulement de lire ses données.
// Ne JAMAIS remplacer ce tableau par une liste personnalisée sans le fusionner :
// next-pwa écrase, il ne complète pas.
const runtimeCaching = require('next-pwa/cache')

// Seule /login est précachée explicitement : c'est une page publique, sans
// risque. Les pages admin (protégées par authentification) ne sont PAS
// précachées de force ici — le service worker s'installe parfois avant que
// la connexion ne soit établie, et figer alors une redirection de connexion
// resterait en cache jusqu'au déploiement suivant. `cacheOnFrontEndNav`
// ci-dessous s'en charge correctement : il capture le vrai contenu, une fois
// authentifié, au fil de la navigation normale dans l'app.
const PAGES_A_PRECACHER = ['/login']
// Révision stable pour un même build, différente d'un déploiement à l'autre —
// force le service worker à rafraîchir cette page précachée à chaque déploiement.
const REVISION_BUILD = String(Date.now())

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Met en cache CHAQUE page visitée par navigation cliquée dans l'app (pas
  // seulement celles chargées via un rechargement complet du navigateur) —
  // essentiel ici puisque Next.js navigue en client-side entre les écrans.
  cacheOnFrontEndNav: true,
  additionalManifestEntries: PAGES_A_PRECACHER.map((url) => ({ url, revision: REVISION_BUILD })),
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
