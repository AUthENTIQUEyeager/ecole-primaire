import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getIdentity } from '@/lib/apiAuth'
import { salaireSchema } from '@/lib/validations/schemas'
import { invalidate } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mois = searchParams.get('mois')
  let sql = `SELECT * FROM salaires WHERE 1 = 1`
  const args: any[] = []
  if (mois) { sql += ' AND mois = ?'; args.push(mois) }
  sql += ' ORDER BY enseignant_nom, mois DESC'
  const result = await db.execute({ sql, args })
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const session = await getIdentity(req)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const body = await req.json()
  const parsed = salaireSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const data = parsed.data
  const id = typeof body.id === 'string' && body.id ? body.id : randomUUID()

  await db.execute({
    sql: `INSERT INTO salaires (id, enseignant_nom, matiere_principale, mois, salaire_net, statut)
          VALUES (?, ?, ?, ?, ?, 'en_attente')`,
    args: [id, data.enseignant_nom, data.matiere_principale ?? null, data.mois, data.salaire_net],
  })

  return NextResponse.json({ id }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getIdentity(req)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const body = await req.json()
  const { id, mode_paiement, marquerPaye, enseignant_nom, matiere_principale, salaire_net } = body as {
    id: string
    mode_paiement?: string
    marquerPaye?: boolean
    enseignant_nom?: string
    matiere_principale?: string
    salaire_net?: number
  }
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  if (marquerPaye) {
    await db.execute({
      sql: `UPDATE salaires SET statut = 'paye', date_paiement = date('now'), mode_paiement = ? WHERE id = ?`,
      args: [mode_paiement ?? null, id],
    })
  } else {
    const fields: string[] = []
    const args: any[] = []
    if (enseignant_nom !== undefined) { fields.push('enseignant_nom = ?'); args.push(enseignant_nom) }
    if (matiere_principale !== undefined) { fields.push('matiere_principale = ?'); args.push(matiere_principale || null) }
    if (salaire_net !== undefined) { fields.push('salaire_net = ?'); args.push(salaire_net) }
    if (fields.length > 0) {
      args.push(id)
      await db.execute({ sql: `UPDATE salaires SET ${fields.join(', ')} WHERE id = ?`, args })
    }
  }
  await invalidate('fondateur:stats')

  return NextResponse.json({ ok: true })
}
