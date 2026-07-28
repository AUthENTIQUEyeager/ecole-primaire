'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { estConnecte } from '@/lib/apiConfig'

/**
 * L'app de bureau (export statique) n'a pas de serveur pour exécuter un
 * middleware — la protection des pages /admin/* se fait donc ici, côté
 * client, au montage. Un bref écran de chargement évite d'afficher le
 * contenu protégé avant la vérification.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [pret, setPret] = useState(false)

  useEffect(() => {
    if (!estConnecte()) {
      router.replace('/login')
      return
    }
    setPret(true)
  }, [router])

  if (!pret) return null
  return <>{children}</>
}
