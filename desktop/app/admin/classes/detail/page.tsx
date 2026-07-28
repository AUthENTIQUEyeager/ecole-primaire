'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { localDB } from '@/lib/sync/indexedDB'
import { AttendanceGrid } from '@/components/absences/AttendanceGrid'

export default function ClasseDetailPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''

  const data = useLiveQuery(async () => {
    if (!localDB || !id) return null
    const [classe, eleves] = await Promise.all([
      localDB.classes.get(id),
      localDB.eleves.where('classe_id').equals(id).and((e) => e.actif === 1).toArray(),
    ])
    if (!classe) return null
    eleves.sort((a, b) => (a.nom + a.prenom).localeCompare(b.nom + b.prenom))
    return { classe, eleves }
  }, [id])

  if (data === null) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Classe introuvable.</p>
        <Link href="/admin/classes" className="text-sm text-primary hover:underline">
          Retour à la liste des classes
        </Link>
      </div>
    )
  }
  if (data === undefined) return <p className="text-sm text-muted">Chargement...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Classe {data.classe.nom}</h1>
        <p className="text-sm text-muted">Appel du jour — cochez les absences et retards</p>
      </div>
      <AttendanceGrid classeId={id} eleves={data.eleves as any} />
    </div>
  )
}
