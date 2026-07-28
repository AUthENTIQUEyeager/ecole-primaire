import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getIdentity } from '@/lib/apiAuth'
import { matiereSchema } from '@/lib/validations/schemas'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getIdentity(req)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const body = await req.json()
  const parsed = matiereSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const data = parsed.data

  const fields = Object.keys(data)
  if (fields.length === 0) return NextResponse.json({ ok: true })
  const setClause = fields.map((f) => `${f} = ?`).join(', ')
  const args = fields.map((f) => (data as any)[f])
  args.push(params.id)

  await db.execute({ sql: `UPDATE matieres SET ${setClause} WHERE id = ?`, args })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getIdentity(_req)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  await db.execute({ sql: `DELETE FROM matieres WHERE id = ?`, args: [params.id] })
  return NextResponse.json({ ok: true })
}
