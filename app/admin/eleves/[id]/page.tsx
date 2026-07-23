import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { EleveDetail } from '@/components/eleves/EleveDetail'

export const dynamic = 'force-dynamic'

async function getData(id: string) {
  const [eleve, paiements, versements, absences, notes, classes] = await Promise.all([
    db.execute({
      sql: `SELECT e.*, c.nom as classe_nom FROM eleves e JOIN classes c ON c.id = e.classe_id WHERE e.id = ?`,
      args: [id],
    }),
    db.execute({ sql: `SELECT * FROM paiements WHERE eleve_id = ? ORDER BY tranche`, args: [id] }),
    db.execute({ sql: `SELECT * FROM versements WHERE eleve_id = ? ORDER BY date_versement DESC`, args: [id] }),
    db.execute({ sql: `SELECT * FROM absences WHERE eleve_id = ? ORDER BY date_absence DESC`, args: [id] }),
    db.execute({
      sql: `SELECT n.*, m.nom as matiere_nom FROM notes n JOIN matieres m ON m.id = n.matiere_id
            WHERE n.eleve_id = ? ORDER BY n.periode, m.nom`,
      args: [id],
    }),
    db.execute(`SELECT id, nom FROM classes ORDER BY nom`),
  ])

  if (!eleve.rows[0]) return null
  return {
    eleve: eleve.rows[0],
    paiements: paiements.rows,
    versements: versements.rows,
    absences: absences.rows,
    notes: notes.rows,
    classes: classes.rows as any[],
  }
}

export default async function EleveDetailPage({ params }: { params: { id: string } }) {
  const data = await getData(params.id)
  if (!data) notFound()

  return <EleveDetail {...data} />
}
