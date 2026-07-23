import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { eleveSchema } from '@/lib/validations/schemas'
import { genererMatricule } from '@/lib/utils/matricule'
import { ajouterActivite } from '@/lib/utils/activityLog'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const classeId = searchParams.get('classe_id')
  const sexe = searchParams.get('sexe')
  const statutPaiement = searchParams.get('statut_paiement')
  const statutMedical = searchParams.get('statut_medical')
  const q = searchParams.get('q')

  let sql = `
    SELECT e.*, c.nom as classe_nom,
      (SELECT MIN(p.statut) FROM paiements p WHERE p.eleve_id = e.id) as statut_paiement
    FROM eleves e
    JOIN classes c ON c.id = e.classe_id
    WHERE e.actif = 1
  `
  const args: any[] = []

  if (classeId) {
    sql += ' AND e.classe_id = ?'
    args.push(classeId)
  }
  if (sexe) {
    sql += ' AND e.sexe = ?'
    args.push(sexe)
  }
  if (statutMedical) {
    sql += ' AND e.statut_medical = ?'
    args.push(statutMedical)
  }
  if (q) {
    sql += ' AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.matricule LIKE ?)'
    args.push(`%${q}%`, `%${q}%`, `%${q}%`)
  }
  sql += ' ORDER BY e.nom, e.prenom'

  const result = await db.execute({ sql, args })
  let rows = result.rows

  if (statutPaiement) {
    rows = rows.filter((r) => r.statut_paiement === statutPaiement)
  }

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = eleveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const configRes = await db.execute(`SELECT key, value FROM config`)
  const config = Object.fromEntries(configRes.rows.map((r) => [r.key, r.value as string]))
  const anneeScolaire = config.annee_scolaire ?? new Date().getFullYear().toString()

  const id = randomUUID()
  const matricule = await genererMatricule(anneeScolaire)

  await db.execute({
    sql: `INSERT INTO eleves
      (id, nom, prenom, sexe, date_naissance, lieu_naissance, classe_id, whatsapp_parent,
       nom_parent, telephone_parent, statut_medical, photo_url, matricule, annee_scolaire, actif)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    args: [
      id,
      data.nom,
      data.prenom,
      data.sexe,
      data.date_naissance,
      data.lieu_naissance ?? null,
      data.classe_id,
      data.whatsapp_parent,
      data.nom_parent,
      data.telephone_parent ?? null,
      data.statut_medical ?? null,
      data.photo_url ?? null,
      matricule,
      anneeScolaire,
    ],
  })

  // Création automatique des 3 tranches de paiement à partir de la configuration
  const tranches = [
    { n: 1, montant: Number(config.tranche1_montant ?? 15000), echeance: config.tranche1_echeance },
    { n: 2, montant: Number(config.tranche2_montant ?? 12000), echeance: config.tranche2_echeance },
    { n: 3, montant: Number(config.tranche3_montant ?? 8000), echeance: config.tranche3_echeance },
  ]
  for (const t of tranches) {
    await db.execute({
      sql: `INSERT INTO paiements (id, eleve_id, annee_scolaire, tranche, montant_du, montant_paye, date_echeance, statut)
            VALUES (?, ?, ?, ?, ?, 0, ?, 'en_attente')`,
      args: [randomUUID(), id, anneeScolaire, t.n, t.montant, t.echeance ?? null],
    })
  }

  await ajouterActivite(
    'eleve_ajoute',
    `Nouvelle élève ajoutée : ${data.prenom} ${data.nom}`
  )

  return NextResponse.json({ id, matricule }, { status: 201 })
}
