import { db } from '@/lib/db'
import { NotesPageClient } from '@/components/notes/NotesPageClient'

export const dynamic = 'force-dynamic'

async function getData() {
  const [classes, matieres] = await Promise.all([
    db.execute(`SELECT id, nom FROM classes ORDER BY nom`),
    db.execute(`SELECT id, nom, coefficient FROM matieres ORDER BY nom`),
  ])
  return { classes: classes.rows as any[], matieres: matieres.rows as any[] }
}

export default async function NotesPage() {
  const { classes, matieres } = await getData()
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Notes & Bulletins</h1>
      <NotesPageClient classes={classes} matieres={matieres} />
    </div>
  )
}
