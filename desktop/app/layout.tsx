import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Norio — Gestion (bureau)',
  description: 'Application de bureau — fonctionne sans connexion, synchronise automatiquement.',
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
