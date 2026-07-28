import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'École Primaire Privée Les Étoiles — Gestion (bureau)',
  description: 'Application de bureau — fonctionne sans connexion, synchronise automatiquement.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
