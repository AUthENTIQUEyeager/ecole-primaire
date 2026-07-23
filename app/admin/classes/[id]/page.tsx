import { db } from '@/lib/db'
import { AttendanceGrid } from '@/components/absences/AttendanceGrid'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getClasse(id: string) {
  const [classe, eleves] = await Promise.all([
    db.execute({ sql: `SELECT * FROM classes WHERE id = ?`, args: [id] }),
    db.execute({
      sql: `SELECT id, nom, prenom, matricule FROM eleves WHERE classe_id = ? AND actif = 1 ORDER BY nom, prenom`,
      args: [id],
    }),
  ])
  if (!classe.rows[0]) return null
  return { classe: classe.rows[0], eleves: eleves.rows as any[] }
}

export default async function ClasseDetailPage({ params }: { params: { id: string } }) {
  const data = await getClasse(params.id)
  if (!data) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Classe {data.classe.nom as string}</h1>
        <p className="text-sm text-muted">Appel du jour — cochez les absences et retards</p>
      </div>
      <AttendanceGrid classeId={params.id} eleves={data.eleves as any} />
    </div>
  )
}
