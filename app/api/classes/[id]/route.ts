import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getIdentity } from '@/lib/apiAuth'
import { classeUpdateSchema } from '@/lib/validations/schemas'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const [classe, eleves] = await Promise.all([
    db.execute({ sql: `SELECT * FROM classes WHERE id = ?`, args: [params.id] }),
    db.execute({
      sql: `SELECT id, nom, prenom, matricule FROM eleves WHERE classe_id = ? AND actif = 1 ORDER BY nom, prenom`,
      args: [params.id],
    }),
  ])
  if (!classe.rows[0]) return NextResponse.json({ error: 'Classe introuvable' }, { status: 404 })
  return NextResponse.json({ classe: classe.rows[0], eleves: eleves.rows })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getIdentity(req)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const body = await req.json()
  const parsed = classeUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  await db.execute({
    sql: `UPDATE classes SET enseignant_principal = ? WHERE id = ?`,
    args: [parsed.data.enseignant_principal ?? null, params.id],
  })
  return NextResponse.json({ ok: true })
}
