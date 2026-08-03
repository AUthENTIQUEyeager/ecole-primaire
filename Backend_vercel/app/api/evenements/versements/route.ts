import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getIdentity } from '@/lib/apiAuth'
import { evenementVersementSchema } from '@/lib/validations/schemas'
import { genererNumeroRecu } from '@/lib/utils/recu'
import { computeStatut, formatFCFA } from '@/lib/utils/paiement'
import { ajouterActivite } from '@/lib/utils/activityLog'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getIdentity(req)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = evenementVersementSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const [cotisationRes, evenementRes, eleveRes] = await Promise.all([
    db.execute({ sql: `SELECT * FROM evenement_cotisations WHERE id = ?`, args: [data.cotisation_id] }),
    db.execute({ sql: `SELECT * FROM evenements WHERE id = ?`, args: [data.evenement_id] }),
    db.execute({ sql: `SELECT nom, prenom FROM eleves WHERE id = ?`, args: [data.eleve_id] }),
  ])
  const cotisation = cotisationRes.rows[0]
  const evenement = evenementRes.rows[0]
  if (!cotisation || !evenement) {
    return NextResponse.json({ error: 'Cotisation ou événement introuvable' }, { status: 404 })
  }

  const nouveauMontantPaye = (cotisation.montant_paye as number) + data.montant
  const nouveauStatut = computeStatut(
    nouveauMontantPaye,
    cotisation.montant_du as number,
    evenement.date_evenement as string
  )

  const numeroRecu = genererNumeroRecu(new Date(data.date_versement))
  const versementId = typeof body.id === 'string' && body.id ? body.id : randomUUID()

  await db.execute({
    sql: `INSERT INTO evenement_versements (id, cotisation_id, eleve_id, evenement_id, montant, date_versement, mode_paiement, numero_recu, caissier_nom)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      versementId,
      data.cotisation_id,
      data.eleve_id,
      data.evenement_id,
      data.montant,
      data.date_versement,
      data.mode_paiement,
      numeroRecu,
      data.caissier_nom,
    ],
  })

  await db.execute({
    sql: `UPDATE evenement_cotisations SET montant_paye = ?, statut = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [nouveauMontantPaye, nouveauStatut, data.cotisation_id],
  })

  const eleve = eleveRes.rows[0]
  await ajouterActivite(
    'cotisation_evenement_versee',
    `Cotisation "${evenement.nom}" : ${formatFCFA(data.montant)} versé pour ${eleve?.prenom} ${eleve?.nom}`
  )

  return NextResponse.json({ id: versementId, numero_recu: numeroRecu }, { status: 201 })
}
