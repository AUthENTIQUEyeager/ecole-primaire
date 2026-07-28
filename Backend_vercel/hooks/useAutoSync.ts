'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { compterEnAttente, traiterFileSynchronisation } from '@/lib/sync/syncManager'
import { pullToutesLesDonnees } from '@/lib/localdb/pull'
import { useOnlineStatus } from './useOnlineStatus'

export type EtatSync = 'hors_ligne' | 'synchronisation' | 'a_jour' | 'en_attente'

export function useAutoSync() {
  const isOnline = useOnlineStatus()
  const [enAttente, setEnAttente] = useState(0)
  const [etat, setEtat] = useState<EtatSync>('hors_ligne')
  const [derniereSync, setDerniereSync] = useState<string | null>(null)
  const enCours = useRef(false)

  const rafraichirCompteur = useCallback(async () => {
    setEnAttente(await compterEnAttente())
  }, [])

  useEffect(() => {
    rafraichirCompteur()
  }, [rafraichirCompteur])

  useEffect(() => {
    if (!isOnline) {
      setEtat('hors_ligne')
      return
    }
    if (enCours.current) return
    enCours.current = true
    let annule = false

    async function synchroniser() {
      setEtat('synchronisation')
      // 1) On envoie d'abord ce qui est en attente localement...
      await traiterFileSynchronisation((restants) => {
        if (!annule) setEnAttente(restants)
      })
      // 2) ...puis on retélécharge l'état frais du serveur (y compris les
      // valeurs recalculées côté serveur : matricule, numéro de reçu, etc.)
      const resultat = await pullToutesLesDonnees()
      if (annule) return
      if (resultat.ok && resultat.syncedAt) setDerniereSync(resultat.syncedAt)
      const restants = await compterEnAttente()
      if (annule) return
      setEnAttente(restants)
      setEtat(restants > 0 ? 'en_attente' : 'a_jour')
    }

    synchroniser().finally(() => {
      enCours.current = false
    })

    return () => {
      annule = true
    }
  }, [isOnline])

  return { isOnline, enAttente, etat, derniereSync }
}
