import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getIdentity } from '@/lib/apiAuth'
import { evenementDepenseSchema } from '@/lib/validations/schemas'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getIdentity(req)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const body = await req.json()
  const parsed = evenementDepenseSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const data = parsed.data
  const id = typeof body.id === 'string' && body.id ? body.id : randomUUID()

  await db.execute({
    sql: `INSERT INTO evenement_depenses (id, evenement_id, categorie, description, montant, date_depense, created_by_nom)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, data.evenement_id, data.categorie, data.description, data.montant, data.date_depense, data.created_by_nom],
  })

  return NextResponse.json({ id }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getIdentity(req)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })
  await db.execute({ sql: `DELETE FROM evenement_depenses WHERE id = ?`, args: [id] })
  return NextResponse.json({ ok: true })
}
