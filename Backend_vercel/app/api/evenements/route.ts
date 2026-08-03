import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getIdentity } from '@/lib/apiAuth'
import { evenementSchema } from '@/lib/validations/schemas'
import { ajouterActivite } from '@/lib/utils/activityLog'
import { formatFCFA } from '@/lib/utils/paiement'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getIdentity(req)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const result = await db.execute(`SELECT * FROM evenements ORDER BY date_evenement DESC`)
  return NextResponse.json(result.rows)
}

/**
 * Crée un événement (sortie/clôture) et génère automatiquement une
 * cotisation (montant fixe, réglable en plusieurs fois) pour chaque élève
 * actif des classes concernées — même principe que les 3 tranches créées
 * automatiquement à l'inscription d'un élève.
 */
export async function POST(req: NextRequest) {
  const session = await getIdentity(req)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = evenementSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data
  const id = typeof body.id === 'string' && body.id ? body.id : randomUUID()
  const classesIdsStr = data.classes_ids === 'toutes' ? 'toutes' : data.classes_ids.join(',')

  await db.execute({
    sql: `INSERT INTO evenements (id, nom, type, description, montant_cotisation, date_evenement, classes_ids, statut)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'actif')`,
    args: [id, data.nom, data.type, data.description ?? null, data.montant_cotisation, data.date_evenement, classesIdsStr],
  })

  const elevesRes =
    data.classes_ids === 'toutes'
      ? await db.execute(`SELECT id FROM eleves WHERE actif = 1`)
      : await db.execute({
          sql: `SELECT id FROM eleves WHERE actif = 1 AND classe_id IN (${data.classes_ids.map(() => '?').join(',')})`,
          args: data.classes_ids,
        })

  for (const row of elevesRes.rows) {
    await db.execute({
      sql: `INSERT INTO evenement_cotisations (id, evenement_id, eleve_id, montant_du, montant_paye, statut)
            VALUES (?, ?, ?, ?, 0, 'en_attente')`,
      args: [randomUUID(), id, row.id as string, data.montant_cotisation],
    })
  }

  await ajouterActivite(
    'evenement_cree',
    `Événement "${data.nom}" créé — cotisation ${formatFCFA(data.montant_cotisation)} pour ${elevesRes.rows.length} élève(s)`
  )

  return NextResponse.json({ id, nbEleves: elevesRes.rows.length }, { status: 201 })
}
