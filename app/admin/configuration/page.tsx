'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { localDB } from '@/lib/sync/indexedDB'
import { ConfigurationView } from '@/components/configuration/ConfigurationView'
import { MatieresConfig } from '@/components/configuration/MatieresConfig'

export default function ConfigurationPage() {
  const data = useLiveQuery(async () => {
    if (!localDB) return null
    const [configRows, matieres] = await Promise.all([localDB.config.toArray(), localDB.matieres.toArray()])
    const config = Object.fromEntries(configRows.map((r) => [r.key, r.value]))
    matieres.sort((a, b) => a.nom.localeCompare(b.nom))
    return { config, matieres }
  }, [])

  if (!data) return <p className="text-sm text-muted">Chargement...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Configuration</h1>
      <ConfigurationView config={data.config} />
      <MatieresConfig matieres={data.matieres as any[]} />
    </div>
  )
}
