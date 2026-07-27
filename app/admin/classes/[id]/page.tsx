'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { notFound } from 'next/navigation'
import { localDB } from '@/lib/sync/indexedDB'
import { AttendanceGrid } from '@/components/absences/AttendanceGrid'

export default function ClasseDetailPage({ params }: { params: { id: string } }) {
  const data = useLiveQuery(async () => {
    if (!localDB) return null
    const [classe, eleves] = await Promise.all([
      localDB.classes.get(params.id),
      localDB.eleves.where('classe_id').equals(params.id).and((e) => e.actif === 1).toArray(),
    ])
    if (!classe) return null
    eleves.sort((a, b) => (a.nom + a.prenom).localeCompare(b.nom + b.prenom))
    return { classe, eleves }
  }, [params.id])

  if (data === null) notFound()
  if (data === undefined) return <p className="text-sm text-muted">Chargement...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Classe {data.classe.nom}</h1>
        <p className="text-sm text-muted">Appel du jour — cochez les absences et retards</p>
      </div>
      <AttendanceGrid classeId={params.id} eleves={data.eleves as any} />
    </div>
  )
}
