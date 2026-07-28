'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { localDB } from '@/lib/sync/indexedDB'
import { SalairesView } from '@/components/salaires/SalairesView'

export default function SalairesPage() {
  const moisActuel = new Date().toISOString().slice(0, 7)

  const data = useLiveQuery(async () => {
    if (!localDB) return null
    const salaires = await localDB.salaires.toArray()
    salaires.sort((a, b) => (a.mois < b.mois ? 1 : a.mois > b.mois ? -1 : a.enseignant_nom.localeCompare(b.enseignant_nom)))

    const duMois = salaires.filter((s) => s.mois === moisActuel)
    const resume = {
      masse: duMois.reduce((a, s) => a + s.salaire_net, 0),
      payes: duMois.filter((s) => s.statut === 'paye').length,
      en_attente: duMois.filter((s) => s.statut === 'en_attente').length,
    }
    return { salaires, resume }
  }, [])

  if (!data) return <p className="text-sm text-muted">Chargement...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Salaires</h1>
      <SalairesView salaires={data.salaires as any[]} resume={data.resume as any} moisActuel={moisActuel} />
    </div>
  )
}
