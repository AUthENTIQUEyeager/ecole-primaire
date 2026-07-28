import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Reçoit un lot d'opérations en attente depuis la file IndexedDB du client
 * et les journalise dans sync_queue à des fins d'audit. Le traitement réel
 * de chaque mutation passe par les routes API dédiées (le client rejoue
 * chaque item individuellement) — cette route sert de trace centrale.
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const items = Array.isArray(body) ? body : [body]

  for (const item of items) {
    await db.execute({
      sql: `INSERT INTO sync_queue (id, operation, table_name, record_id, payload, status, synced_at)
            VALUES (?, ?, ?, ?, ?, 'synced', datetime('now'))`,
      args: [
        randomUUID(),
        item.operation ?? 'INSERT',
        item.table_name ?? 'unknown',
        item.record_id ?? '',
        JSON.stringify(item.payload ?? {}),
      ],
    })
  }

  return NextResponse.json({ ok: true, count: items.length })
}
