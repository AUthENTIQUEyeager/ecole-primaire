import { db } from '@/lib/db'
import { DocumentsView } from '@/components/documents/DocumentsView'

export const dynamic = 'force-dynamic'

async function getData() {
  const [eleves, config] = await Promise.all([
    db.execute(`
      SELECT e.id, e.nom, e.prenom, e.matricule, e.annee_scolaire, e.classe_id, e.photo_url, c.nom as classe_nom
      FROM eleves e JOIN classes c ON c.id = e.classe_id
      WHERE e.actif = 1 ORDER BY e.nom, e.prenom
    `),
    db.execute(`SELECT key, value FROM config`),
  ])
  const configObj = Object.fromEntries(config.rows.map((r) => [r.key, r.value as string]))
  return { eleves: eleves.rows as any[], config: configObj }
}

export default async function DocumentsPage() {
  const { eleves, config } = await getData()
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Documents</h1>
      <DocumentsView eleves={eleves} config={config} />
    </div>
  )
}
