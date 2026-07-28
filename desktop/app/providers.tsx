'use client'

// Pas de SessionProvider ici : l'app de bureau n'utilise pas next-auth
// (voir lib/apiConfig.ts — authentification par jeton stocké localement).
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
