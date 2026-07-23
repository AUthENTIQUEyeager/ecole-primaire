import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const body = await req.json()
  const { justifiee, motif } = body as { justifiee?: boolean; motif?: string }

  await db.execute({
    sql: `UPDATE absences SET justifiee = ?, motif = ? WHERE id = ?`,
    args: [justifiee ? 1 : 0, motif ?? null, params.id],
  })
  return NextResponse.json({ ok: true })
}
