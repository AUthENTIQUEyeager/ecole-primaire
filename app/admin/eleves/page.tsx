'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { localDB } from '@/lib/sync/indexedDB'
import { EleveTable } from '@/components/eleves/EleveTable'

export default function ElevesPage() {
  const data = useLiveQuery(async () => {
    if (!localDB) return null
    const [eleves, classes, paiements] = await Promise.all([
      localDB.eleves.where('actif').equals(1).toArray(),
      localDB.classes.toArray(),
      localDB.paiements.toArray(),
    ])
    const classesById = new Map(classes.map((c) => [c.id, c]))
    const ordreStatut = ['en_retard_total', 'en_retard_partiel', 'en_cours', 'en_attente']

    const elevesEnrichis = eleves
      .map((e) => {
        const tranches = paiements.filter((p) => p.eleve_id === e.id)
        const montant_du_total = tranches.reduce((a, p) => a + p.montant_du, 0)
        const montant_paye_total = tranches.reduce((a, p) => a + p.montant_paye, 0)
        const nonSoldees = tranches.filter((p) => p.statut !== 'soldee')
        nonSoldees.sort((a, b) => ordreStatut.indexOf(a.statut) - ordreStatut.indexOf(b.statut))
        return {
          ...e,
          classe_nom: classesById.get(e.classe_id)?.nom ?? '',
          statut_paiement: nonSoldees[0]?.statut ?? 'soldee',
          montant_du_total,
          montant_paye_total,
        }
      })
      .sort((a, b) => (a.nom + a.prenom).localeCompare(b.nom + b.prenom))

    return { eleves: elevesEnrichis, classes: classes.map((c) => ({ id: c.id, nom: c.nom })) }
  }, [])

  if (!data) return <p className="text-sm text-muted">Chargement...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Élèves</h1>
      <EleveTable eleves={data.eleves as any} classes={data.classes} />
    </div>
  )
}
