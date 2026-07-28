import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getIdentity } from '@/lib/apiAuth'
import { configSchema } from '@/lib/validations/schemas'
import { invalidate } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await db.execute(`SELECT key, value FROM config`)
  const config = Object.fromEntries(result.rows.map((r) => [r.key, r.value]))
  return NextResponse.json(config)
}

export async function PUT(req: NextRequest) {
  const session = await getIdentity(req)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const body = await req.json()
  const parsed = configSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  for (const [key, value] of Object.entries(parsed.data)) {
    await db.execute({
      sql: `INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      args: [key, String(value)],
    })
  }
  await invalidate('fondateur:stats')

  return NextResponse.json({ ok: true })
}
