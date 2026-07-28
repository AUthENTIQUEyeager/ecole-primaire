import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const [paiements, versements] = await Promise.all([
    db.execute({
      sql: `SELECT * FROM paiements WHERE eleve_id = ? ORDER BY tranche`,
      args: [params.id],
    }),
    db.execute({
      sql: `SELECT * FROM versements WHERE eleve_id = ? ORDER BY date_versement DESC`,
      args: [params.id],
    }),
  ])

  return NextResponse.json({ paiements: paiements.rows, versements: versements.rows })
}
