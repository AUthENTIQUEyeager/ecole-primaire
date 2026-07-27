import { localDB } from '@/lib/sync/indexedDB'

/**
 * Télécharge l'intégralité des données (13 tables) en un seul aller-retour
 * réseau et remplace le contenu local en une transaction. Appelée au premier
 * chargement en ligne et à chaque reconnexion (après le vidage de la file de
 * synchronisation — voir useAutoSync).
 */
export async function pullToutesLesDonnees(): Promise<{ ok: boolean; syncedAt?: string }> {
  if (!localDB) return { ok: false }

  let data: any
  try {
    const res = await fetch('/api/sync/pull')
    if (!res.ok) return { ok: false }
    data = await res.json()
  } catch {
    return { ok: false }
  }

  await localDB.transaction(
    'rw',
    [
      localDB.classes,
      localDB.matieres,
      localDB.eleves,
      localDB.notes,
      localDB.absences,
      localDB.paiements,
      localDB.versements,
      localDB.depenses,
      localDB.salaires,
      localDB.annonces,
      localDB.config,
      localDB.meta,
    ],
    async () => {
      await Promise.all([
        localDB.classes.clear().then(() => localDB.classes.bulkAdd(data.classes ?? [])),
        localDB.matieres.clear().then(() => localDB.matieres.bulkAdd(data.matieres ?? [])),
        localDB.eleves.clear().then(() => localDB.eleves.bulkAdd(data.eleves ?? [])),
        localDB.notes.clear().then(() => localDB.notes.bulkAdd(data.notes ?? [])),
        localDB.absences.clear().then(() => localDB.absences.bulkAdd(data.absences ?? [])),
        localDB.paiements.clear().then(() => localDB.paiements.bulkAdd(data.paiements ?? [])),
        localDB.versements.clear().then(() => localDB.versements.bulkAdd(data.versements ?? [])),
        localDB.depenses.clear().then(() => localDB.depenses.bulkAdd(data.depenses ?? [])),
        localDB.salaires.clear().then(() => localDB.salaires.bulkAdd(data.salaires ?? [])),
        localDB.annonces.clear().then(() => localDB.annonces.bulkAdd(data.annonces ?? [])),
        localDB.config.clear().then(() => localDB.config.bulkAdd(data.config ?? [])),
      ])
      await localDB.meta.put({ key: 'lastFullSync', value: data.syncedAt ?? new Date().toISOString() })
    }
  )

  return { ok: true, syncedAt: data.syncedAt }
}
