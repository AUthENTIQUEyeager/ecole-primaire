import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
