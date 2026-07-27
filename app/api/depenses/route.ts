import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { depenseSchema } from '@/lib/validations/schemas'
import { invalidate } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categorie = searchParams.get('categorie')
  const mois = searchParams.get('mois') // YYYY-MM

  let sql = `SELECT * FROM depenses WHERE 1 = 1`
  const args: any[] = []
  if (categorie) { sql += ' AND categorie = ?'; args.push(categorie) }
  if (mois) { sql += " AND strftime('%Y-%m', date_depense) = ?"; args.push(mois) }
  sql += ' ORDER BY date_depense DESC'

  const result = await db.execute({ sql, args })
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const body = await req.json()
  const parsed = depenseSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const data = parsed.data
  const id = typeof body.id === 'string' && body.id ? body.id : randomUUID()

  await db.execute({
    sql: `INSERT INTO depenses (id, categorie, description, montant, date_depense, created_by_nom)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, data.categorie, data.description, data.montant, data.date_depense, data.created_by_nom],
  })
  await invalidate('fondateur:stats')

  return NextResponse.json({ id }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })
  await db.execute({ sql: `DELETE FROM depenses WHERE id = ?`, args: [id] })
  await invalidate('fondateur:stats')
  return NextResponse.json({ ok: true })
}
