'use client'

import { useEffect } from 'react'
import { localDB } from '@/lib/sync/indexedDB'
import { useOnlineStatus } from './useOnlineStatus'

/**
 * Au premier chargement (en ligne), met en cache dans IndexedDB :
 * élèves, classes, matières, config, statuts de paiement.
 * Permet la consultation complète en mode hors ligne.
 */
export function useOfflineData() {
  const isOnline = useOnlineStatus()

  useEffect(() => {
    if (!isOnline || !localDB) return

    async function rafraichirCache() {
      try {
        const [elevesRes, classesRes, matieresRes, configRes, paiementsRes] = await Promise.all([
          fetch('/api/eleves'),
          fetch('/api/classes'),
          fetch('/api/matieres'),
          fetch('/api/config'),
          fetch('/api/paiements'),
        ])

        if (elevesRes.ok) {
          const eleves = await elevesRes.json()
          await localDB.eleves.bulkPut(eleves)
        }
        if (classesRes.ok) {
          const classes = await classesRes.json()
          await localDB.classes.bulkPut(classes)
        }
        if (matieresRes.ok) {
          const matieres = await matieresRes.json()
          await localDB.matieres.bulkPut(matieres)
        }
        if (configRes.ok) {
          const config = await configRes.json()
          const entries = Object.entries(config).map(([key, value]) => ({
            key,
            value: String(value),
          }))
          await localDB.config.bulkPut(entries)
        }
        if (paiementsRes.ok) {
          const paiements = await paiementsRes.json()
          await localDB.paiements.bulkPut(paiements)
        }
      } catch {
        // Échec silencieux — le cache existant reste disponible.
      }
    }

    rafraichirCache()
  }, [isOnline])
}
