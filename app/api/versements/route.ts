import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { versementSchema } from '@/lib/validations/schemas'
import { genererNumeroRecu } from '@/lib/utils/recu'
import { repartirVersement, computeStatut, formatFCFA, type Tranche } from '@/lib/utils/paiement'
import { ajouterActivite } from '@/lib/utils/activityLog'
import { invalidate } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = versementSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const trancheRes = await db.execute({
    sql: `SELECT * FROM paiements WHERE eleve_id = ? AND statut != 'soldee' ORDER BY tranche`,
    args: [data.eleve_id],
  })
  const tranches = trancheRes.rows as unknown as Tranche[]

  if (tranches.length === 0) {
    return NextResponse.json({ error: "Toutes les tranches de cet élève sont déjà soldées" }, { status: 400 })
  }

  const repartitions = repartirVersement(tranches, data.montant, data.tranche_depart)

  // La première tranche impactée reçoit le numéro de reçu (les reçus référencent la
  // tranche principale du versement ; le détail des tranches reste dans versements/paiements).
  const numeroRecu = genererNumeroRecu(new Date(data.date_versement))
  const versementId = typeof body.id === 'string' && body.id ? body.id : randomUUID()

  await db.execute({
    sql: `INSERT INTO versements (id, eleve_id, paiement_id, montant, date_versement, mode_paiement, numero_recu, caissier_nom)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      versementId,
      data.eleve_id,
      repartitions[0].trancheId,
      data.montant,
      data.date_versement,
      data.mode_paiement,
      numeroRecu,
      data.caissier_nom,
    ],
  })

  for (const r of repartitions) {
    const tranche = tranches.find((t) => t.id === r.trancheId)!
    const nouveauStatut = computeStatut(r.nouveauMontantPaye, tranche.montant_du, tranche.date_echeance)
    await db.execute({
      sql: `UPDATE paiements SET montant_paye = ?, statut = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [r.nouveauMontantPaye, nouveauStatut, r.trancheId],
    })
  }

  const eleveRes = await db.execute({
    sql: `SELECT nom, prenom FROM eleves WHERE id = ?`,
    args: [data.eleve_id],
  })
  const eleve = eleveRes.rows[0]

  await ajouterActivite(
    'versement_enregistre',
    `Versement de ${formatFCFA(data.montant)} enregistré pour ${eleve?.prenom} ${eleve?.nom}`
  )
  await invalidate('fondateur:stats')

  return NextResponse.json({ id: versementId, numero_recu: numeroRecu, repartitions }, { status: 201 })
}
