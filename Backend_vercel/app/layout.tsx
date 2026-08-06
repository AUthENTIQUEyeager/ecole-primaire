import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Norio — Gestion scolaire',
  description: 'Plateforme de gestion scolaire',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
        {/* Portail d'impression : ImprimerBouton y monte le document actif au
            moment de l'impression. Masqué à l'écran, seul son contenu reste
            visible sur le papier (voir la règle @media print dans globals.css). */}
        <div id="zone-impression" />
      </body>
    </html>
  )
}
