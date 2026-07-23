import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { matiereSchema } from '@/lib/validations/schemas'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await db.execute(`SELECT * FROM matieres ORDER BY nom`)
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const body = await req.json()
  const parsed = matiereSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const data = parsed.data
  const id = randomUUID()

  await db.execute({
    sql: `INSERT INTO matieres (id, nom, code, coefficient) VALUES (?, ?, ?, ?)`,
    args: [id, data.nom, data.code, data.coefficient],
  })

  return NextResponse.json({ id }, { status: 201 })
}
