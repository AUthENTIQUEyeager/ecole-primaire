import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { noteSchema } from '@/lib/validations/schemas'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const batchSchema = z.array(noteSchema)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const classeId = searchParams.get('classe_id')
  const periode = searchParams.get('periode')

  let sql = `
    SELECT n.*, e.nom, e.prenom, m.nom as matiere_nom, m.coefficient
    FROM notes n
    JOIN eleves e ON e.id = n.eleve_id
    JOIN matieres m ON m.id = n.matiere_id
    WHERE 1 = 1
  `
  const args: any[] = []
  if (classeId) { sql += ' AND e.classe_id = ?'; args.push(classeId) }
  if (periode) { sql += ' AND n.periode = ?'; args.push(periode) }

  const result = await db.execute({ sql, args })
  return NextResponse.json(result.rows)
}

/** Enregistrement en lot depuis la grille de saisie des notes (bouton "Tout enregistrer"). */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = batchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  for (const note of parsed.data) {
    await db.execute({
      sql: `INSERT INTO notes (id, eleve_id, matiere_id, enseignant_nom, valeur, note_sur, type, titre, periode, date_evaluation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(),
        note.eleve_id,
        note.matiere_id,
        note.enseignant_nom ?? null,
        note.valeur,
        note.note_sur,
        note.type,
        note.titre ?? null,
        note.periode,
        note.date_evaluation,
      ],
    })
  }

  return NextResponse.json({ ok: true, count: parsed.data.length }, { status: 201 })
}
