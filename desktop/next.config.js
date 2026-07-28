/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Export statique : Tauri charge des fichiers locaux (pas de serveur
  // Next.js qui tourne). Toutes les pages sont déjà des Client Components
  // lisant IndexedDB — aucune n'a besoin de rendu serveur.
  output: 'export',
  images: { unoptimized: true },
  // Les liens internes (routeur Next) doivent pointer vers de vrais dossiers
  // "index.html" une fois exportés (comportement par défaut avec trailingSlash).
  trailingSlash: true,
}

module.exports = nextConfig
