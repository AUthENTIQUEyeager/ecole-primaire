'use client'

import { useState, useEffect, useCallback } from 'react'
import { compterEnAttente, traiterFileSynchronisation } from '@/lib/sync/syncManager'
import { useOnlineStatus } from './useOnlineStatus'

export function useSyncQueue() {
  const isOnline = useOnlineStatus()
  const [enAttente, setEnAttente] = useState(0)
  const [synchronisation, setSynchronisation] = useState(false)
  const [dernierMessage, setDernierMessage] = useState<string | null>(null)

  const rafraichirCompteur = useCallback(async () => {
    setEnAttente(await compterEnAttente())
  }, [])

  useEffect(() => {
    rafraichirCompteur()
  }, [rafraichirCompteur])

  useEffect(() => {
    if (!isOnline) return
    let annule = false

    async function synchroniser() {
      const count = await compterEnAttente()
      if (count === 0) return
      setSynchronisation(true)
      const { envoyes } = await traiterFileSynchronisation((restants) => {
        if (!annule) setEnAttente(restants)
      })
      if (!annule) {
        setSynchronisation(false)
        setDernierMessage(
          `Synchronisation réussie — ${envoyes} enregistrement(s) envoyés`
        )
        await rafraichirCompteur()
      }
    }

    synchroniser()
    return () => {
      annule = true
    }
  }, [isOnline, rafraichirCompteur])

  return { enAttente, synchronisation, dernierMessage, isOnline }
}
