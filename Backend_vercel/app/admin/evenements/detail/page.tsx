'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { EvenementDetail } from '@/components/evenements/EvenementDetail'

function EvenementDetailInner() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''

  if (!id) return <p className="text-sm text-muted">Événement introuvable.</p>

  return <EvenementDetail evenementId={id} />
}

export default function EvenementDetailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Chargement...</p>}>
      <EvenementDetailInner />
    </Suspense>
  )
}
