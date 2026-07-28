import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getIdentity } from '@/lib/apiAuth'
import { annonceSchema } from '@/lib/validations/schemas'
import { invalidate } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await db.execute(`SELECT * FROM annonces ORDER BY created_at DESC`)
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const session = await getIdentity(req)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const body = await req.json()
  const parsed = annonceSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const data = parsed.data
  const id = typeof body.id === 'string' && body.id ? body.id : randomUUID()

  await db.execute({
    sql: `INSERT INTO annonces (id, titre, contenu, auteur_nom, priorite, date_debut, date_fin)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, data.titre, data.contenu, data.auteur_nom, data.priorite, data.date_debut, data.date_fin ?? null],
  })
  await invalidate('fondateur:stats')

  return NextResponse.json({ id }, { status: 201 })
}
