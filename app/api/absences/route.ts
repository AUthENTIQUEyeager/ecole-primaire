import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { absenceSchema } from '@/lib/validations/schemas'
import { ajouterActivite } from '@/lib/utils/activityLog'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const classeId = searchParams.get('classe_id')
  const dateDebut = searchParams.get('date_debut')
  const dateFin = searchParams.get('date_fin')
  const type = searchParams.get('type')
  const justifiee = searchParams.get('justifiee')

  let sql = `
    SELECT a.*, e.nom, e.prenom, c.nom as classe_nom
    FROM absences a
    JOIN eleves e ON e.id = a.eleve_id
    JOIN classes c ON c.id = e.classe_id
    WHERE 1 = 1
  `
  const args: any[] = []
  if (classeId) { sql += ' AND e.classe_id = ?'; args.push(classeId) }
  if (dateDebut) { sql += ' AND a.date_absence >= ?'; args.push(dateDebut) }
  if (dateFin) { sql += ' AND a.date_absence <= ?'; args.push(dateFin) }
  if (type) { sql += ' AND a.type = ?'; args.push(type) }
  if (justifiee !== null && justifiee !== '') { sql += ' AND a.justifiee = ?'; args.push(justifiee === 'true' ? 1 : 0) }
  sql += ' ORDER BY a.date_absence DESC'

  const result = await db.execute({ sql, args })
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = absenceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data
  const id = randomUUID()

  await db.execute({
    sql: `INSERT INTO absences (id, eleve_id, date_absence, type, justifiee, motif, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, data.eleve_id, data.date_absence, data.type, data.justifiee ? 1 : 0, data.motif ?? null, session.user.name ?? 'admin'],
  })

  const eleveRes = await db.execute({ sql: `SELECT nom, prenom FROM eleves WHERE id = ?`, args: [data.eleve_id] })
  const eleve = eleveRes.rows[0]
  await ajouterActivite(
    'absence_enregistree',
    `Absence enregistrée pour ${eleve?.prenom} ${eleve?.nom} le ${data.date_absence}`
  )

  return NextResponse.json({ id }, { status: 201 })
}
