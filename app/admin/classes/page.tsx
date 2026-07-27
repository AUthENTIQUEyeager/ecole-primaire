'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { localDB } from '@/lib/sync/indexedDB'
import { ClassesGrid } from '@/components/classes/ClassesGrid'

const ORDRE = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2']

export default function ClassesPage() {
  const classes = useLiveQuery(async () => {
    if (!localDB) return null
    const [classes, eleves] = await Promise.all([localDB.classes.toArray(), localDB.eleves.where('actif').equals(1).toArray()])
    return classes
      .map((c) => ({ ...c, effectif: eleves.filter((e) => e.classe_id === c.id).length }))
      .sort((a, b) => ORDRE.indexOf(a.nom) - ORDRE.indexOf(b.nom))
  }, [])

  if (!classes) return <p className="text-sm text-muted">Chargement...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Classes</h1>
      <ClassesGrid classes={classes as any[]} />
    </div>
  )
}
