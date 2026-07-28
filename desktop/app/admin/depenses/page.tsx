'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { localDB } from '@/lib/sync/indexedDB'
import { DepensesView } from '@/components/depenses/DepensesView'

export default function DepensesPage() {
  const data = useLiveQuery(async () => {
    if (!localDB) return null
    const depenses = await localDB.depenses.toArray()
    depenses.sort((a, b) => (a.date_depense < b.date_depense ? 1 : -1))

    const moisCourant = new Date().toISOString().slice(0, 7)
    const parCategorie = new Map<string, number>()
    for (const d of depenses) {
      if (d.date_depense.slice(0, 7) !== moisCourant) continue
      parCategorie.set(d.categorie, (parCategorie.get(d.categorie) ?? 0) + d.montant)
    }
    const totalParCategorie = [...parCategorie.entries()].map(([categorie, total]) => ({ categorie, total }))

    return { depenses, totalParCategorie }
  }, [])

  if (!data) return <p className="text-sm text-muted">Chargement...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Dépenses</h1>
      <DepensesView depenses={data.depenses as any[]} totalParCategorie={data.totalParCategorie as any[]} />
    </div>
  )
}
