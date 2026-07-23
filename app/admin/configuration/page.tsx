import { db } from '@/lib/db'
import { ConfigurationView } from '@/components/configuration/ConfigurationView'
import { MatieresConfig } from '@/components/configuration/MatieresConfig'

export const dynamic = 'force-dynamic'

export default async function ConfigurationPage() {
  const [configRes, matieresRes] = await Promise.all([
    db.execute(`SELECT key, value FROM config`),
    db.execute(`SELECT * FROM matieres ORDER BY nom`),
  ])
  const config = Object.fromEntries(configRes.rows.map((r) => [r.key, r.value as string]))

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Configuration</h1>
      <ConfigurationView config={config} />
      <MatieresConfig matieres={matieresRes.rows as any[]} />
    </div>
  )
}
