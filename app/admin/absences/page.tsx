import { db } from '@/lib/db'
import { AbsencesView } from '@/components/absences/AbsencesView'

export const dynamic = 'force-dynamic'

async function getData() {
  const [absences, classes, stats] = await Promise.all([
    db.execute(`
      SELECT a.*, e.nom, e.prenom, c.nom as classe_nom
      FROM absences a
      JOIN eleves e ON e.id = a.eleve_id
      JOIN classes c ON c.id = e.classe_id
      ORDER BY a.date_absence DESC LIMIT 200
    `),
    db.execute(`SELECT id, nom FROM classes ORDER BY nom`),
    db.execute(`
      SELECT c.nom, COUNT(a.id) as total
      FROM classes c
      LEFT JOIN eleves e ON e.classe_id = c.id
      LEFT JOIN absences a ON a.eleve_id = e.id AND a.type = 'absence'
      GROUP BY c.id ORDER BY c.nom
    `),
  ])
  return { absences: absences.rows as any[], classes: classes.rows as any[], stats: stats.rows as any[] }
}

export default async function AbsencesPage() {
  const { absences, classes, stats } = await getData()
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Absences</h1>
      <AbsencesView absences={absences} classes={classes} stats={stats} />
    </div>
  )
}
