import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const periode = searchParams.get('periode')

  let sql = `
    SELECT n.*, m.nom as matiere_nom, m.coefficient
    FROM notes n JOIN matieres m ON m.id = n.matiere_id
    WHERE n.eleve_id = ?
  `
  const args: any[] = [params.id]
  if (periode) {
    sql += ' AND n.periode = ?'
    args.push(periode)
  }
  sql += ' ORDER BY m.nom, n.date_evaluation'

  const result = await db.execute({ sql, args })
  return NextResponse.json(result.rows)
}
