import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const result = await db.execute({
    sql: `SELECT * FROM absences WHERE eleve_id = ? ORDER BY date_absence DESC`,
    args: [params.id],
  })
  return NextResponse.json(result.rows)
}
