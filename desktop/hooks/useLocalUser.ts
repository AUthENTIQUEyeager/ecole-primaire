'use client'

import { useEffect, useState } from 'react'
import { getUtilisateur, type UtilisateurLocal } from '@/lib/apiConfig'

/** Remplace useSession() de next-auth — l'app de bureau n'a pas de session serveur. */
export function useLocalUser(): { user: UtilisateurLocal | null } {
  const [user, setUser] = useState<UtilisateurLocal | null>(null)
  useEffect(() => {
    setUser(getUtilisateur())
  }, [])
  return { user }
}
