'use client'

import { WifiOff, RefreshCw } from 'lucide-react'
import { useSyncQueue } from '@/hooks/useSyncQueue'
import { useOfflineData } from '@/hooks/useOfflineData'
import { useState, useEffect } from 'react'

export function OfflineBanner() {
  useOfflineData()
  const { isOnline, enAttente, synchronisation } = useSyncQueue()
  const [derniereSyncTexte, setDerniereSyncTexte] = useState('')

  useEffect(() => {
    if (isOnline && enAttente === 0 && !synchronisation) {
      setDerniereSyncTexte(
        `${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      )
    }
  }, [isOnline, enAttente, synchronisation])

  if (isOnline && enAttente === 0) return null

  return (
    <div
      className={`flex items-center gap-2 border-b px-4 py-2 text-sm ${
        isOnline ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      {isOnline ? (
        <RefreshCw size={14} className={synchronisation ? 'animate-spin' : ''} />
      ) : (
        <WifiOff size={14} />
      )}
      {isOnline
        ? `${enAttente} modification(s) en attente de synchronisation`
        : `Hors ligne — dernière synchronisation le ${derniereSyncTexte || '—'}`}
    </div>
  )
}
