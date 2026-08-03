'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { localDB } from '@/lib/sync/indexedDB'
import { EvenementsView } from '@/components/evenements/EvenementsView'

export default function EvenementsPage() {
  const data = useLiveQuery(async () => {
    if (!localDB) return null
    const [evenements, cotisations, classes] = await Promise.all([
      localDB.evenements.toArray(),
      localDB.evenementCotisations.toArray(),
      localDB.classes.toArray(),
    ])

    const evenementsEnrichis = evenements
      .map((ev) => {
        const cotisationsEv = cotisations.filter((c) => c.evenement_id === ev.id)
        return {
          ...ev,
          totalCotise: cotisationsEv.reduce((a, c) => a + c.montant_paye, 0),
          totalAttendu: cotisationsEv.reduce((a, c) => a + c.montant_du, 0),
        }
      })
      .sort((a, b) => (a.date_evenement < b.date_evenement ? 1 : -1))

    return { evenements: evenementsEnrichis, classes: classes.map((c) => ({ id: c.id, nom: c.nom })) }
  }, [])

  if (!data) return <p className="text-sm text-muted">Chargement...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Sorties & Clôtures</h1>
      <EvenementsView evenements={data.evenements as any} classes={data.classes} />
    </div>
  )
}
