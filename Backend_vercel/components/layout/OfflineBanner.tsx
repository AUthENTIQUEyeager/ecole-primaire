'use client'

import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useAutoSync } from '@/hooks/useAutoSync'

/**
 * Indicateur d'état de synchronisation, toujours visible dans l'entête admin.
 * L'app fonctionne intégralement sur les données locales (IndexedDB) — ce
 * bandeau informe seulement de l'état de la synchro avec le serveur, il ne
 * bloque jamais l'utilisation.
 */
export function OfflineBanner() {
  const { isOnline, enAttente, etat, derniereSync } = useAutoSync()

  if (etat === 'a_jour') return null

  const texteDerniereSync = derniereSync
    ? new Date(derniereSync).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) +
      ' à ' +
      new Date(derniereSync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div
      className={`flex items-center gap-2 border-b px-4 py-2 text-sm ${
        !isOnline
          ? 'border-red-200 bg-red-50 text-red-800'
          : etat === 'synchronisation'
            ? 'border-blue-200 bg-blue-50 text-blue-800'
            : 'border-amber-200 bg-amber-50 text-amber-800'
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff size={14} />
          Hors ligne — toutes vos actions restent disponibles et se synchroniseront automatiquement
          {texteDerniereSync ? ` (dernière synchro : ${texteDerniereSync})` : ''}
        </>
      ) : etat === 'synchronisation' ? (
        <>
          <RefreshCw size={14} className="animate-spin" />
          Synchronisation en cours...
        </>
      ) : (
        <>
          <CheckCircle2 size={14} />
          {enAttente} modification(s) en attente d'envoi
        </>
      )}
    </div>
  )
}
