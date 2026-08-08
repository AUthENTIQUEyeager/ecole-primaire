import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getIdentity } from '@/lib/apiAuth'
import { classeCreateSchema } from '@/lib/validations/schemas'
import { ajouterActivite } from '@/lib/utils/activityLog'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await db.execute(`
    SELECT c.*, (SELECT COUNT(*) FROM eleves e WHERE e.classe_id = c.id AND e.actif = 1) as effectif
    FROM classes c
    ORDER BY CASE c.nom WHEN 'CP1' THEN 1 WHEN 'CP2' THEN 2 WHEN 'CE1' THEN 3
      WHEN 'CE2' THEN 4 WHEN 'CM1' THEN 5 WHEN 'CM2' THEN 6 END
  `)
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const session = await getIdentity(req)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = classeCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const existante = await db.execute({ sql: `SELECT id FROM classes WHERE nom = ?`, args: [data.nom] })
  if (existante.rows[0]) {
    return NextResponse.json({ error: `La classe ${data.nom} existe déjà` }, { status: 409 })
  }

  const configRes = await db.execute(`SELECT value FROM config WHERE key = 'annee_scolaire'`)
  const anneeScolaire = (configRes.rows[0]?.value as string) ?? new Date().getFullYear().toString()

  // Accepte l'id généré côté client (écriture optimiste hors ligne), même
  // logique que pour la création d'élève : garantit que l'enregistrement
  // local et l'enregistrement serveur partagent le même id.
  const id = typeof body.id === 'string' && body.id ? body.id : randomUUID()

  await db.execute({
    sql: `INSERT INTO classes (id, nom, effectif_max, enseignant_principal, annee_scolaire)
          VALUES (?, ?, ?, ?, ?)`,
    args: [id, data.nom, data.effectif_max ?? 40, data.enseignant_principal ?? null, anneeScolaire],
  })

  await ajouterActivite('classe_ajoutee', `Nouvelle classe créée : ${data.nom}`)

  return NextResponse.json({ id }, { status: 201 })
}
