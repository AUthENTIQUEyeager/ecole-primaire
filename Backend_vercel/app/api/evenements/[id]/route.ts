import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getIdentity } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getIdentity(req)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const [evenementRes, cotisationsRes, versementsRes, depensesRes] = await Promise.all([
    db.execute({ sql: `SELECT * FROM evenements WHERE id = ?`, args: [params.id] }),
    db.execute({
      sql: `SELECT ec.*, e.nom AS eleve_nom, e.prenom AS eleve_prenom, e.classe_id
            FROM evenement_cotisations ec JOIN eleves e ON e.id = ec.eleve_id
            WHERE ec.evenement_id = ?`,
      args: [params.id],
    }),
    db.execute({
      sql: `SELECT * FROM evenement_versements WHERE evenement_id = ? ORDER BY date_versement DESC`,
      args: [params.id],
    }),
    db.execute({
      sql: `SELECT * FROM evenement_depenses WHERE evenement_id = ? ORDER BY date_depense DESC`,
      args: [params.id],
    }),
  ])

  if (!evenementRes.rows[0]) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
  }

  return NextResponse.json({
    evenement: evenementRes.rows[0],
    cotisations: cotisationsRes.rows,
    versements: versementsRes.rows,
    depenses: depensesRes.rows,
  })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getIdentity(req)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const body = await req.json()
  if (body.statut && !['actif', 'cloture'].includes(body.statut)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }
  await db.execute({
    sql: `UPDATE evenements SET statut = ? WHERE id = ?`,
    args: [body.statut ?? 'actif', params.id],
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getIdentity(_req)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  await db.execute({ sql: `DELETE FROM evenements WHERE id = ?`, args: [params.id] })
  return NextResponse.json({ ok: true })
}
