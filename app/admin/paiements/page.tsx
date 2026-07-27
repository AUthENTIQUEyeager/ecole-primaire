'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { localDB } from '@/lib/sync/indexedDB'
import { PaiementsView } from '@/components/paiements/PaiementsView'

const ORDRE_STATUT = ['en_retard_total', 'en_retard_partiel', 'en_cours', 'en_attente']

export default function PaiementsPage() {
  const eleves = useLiveQuery(async () => {
    if (!localDB) return null
    const [eleves, classes, paiements] = await Promise.all([
      localDB.eleves.where('actif').equals(1).toArray(),
      localDB.classes.toArray(),
      localDB.paiements.toArray(),
    ])
    const classesById = new Map(classes.map((c) => [c.id, c]))

    return eleves
      .map((e) => {
        const tranches = paiements.filter((p) => p.eleve_id === e.id)
        const nonSoldees = tranches.filter((p) => p.statut !== 'soldee')
        nonSoldees.sort((a, b) => ORDRE_STATUT.indexOf(a.statut) - ORDRE_STATUT.indexOf(b.statut))
        return {
          id: e.id,
          nom: e.nom,
          prenom: e.prenom,
          whatsapp_parent: e.whatsapp_parent,
          nom_parent: e.nom_parent,
          classe_nom: classesById.get(e.classe_id)?.nom ?? '',
          montant_du_total: tranches.reduce((a, p) => a + p.montant_du, 0),
          montant_paye_total: tranches.reduce((a, p) => a + p.montant_paye, 0),
          statut_paiement: nonSoldees[0]?.statut ?? 'soldee',
        }
      })
      .sort((a, b) => (a.nom + a.prenom).localeCompare(b.nom + b.prenom))
  }, [])

  if (!eleves) return <p className="text-sm text-muted">Chargement...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Paiements</h1>
      <PaiementsView eleves={eleves as any} />
    </div>
  )
}
