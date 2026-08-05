'use client'

import { useEffect, useMemo, useRef } from 'react'
import { usePDF } from '@react-pdf/renderer'
import { Download, Printer, Loader2, AlertTriangle } from 'lucide-react'

interface PDFActionsProps {
  document: React.ReactElement
  fileName: string
  downloadLabel?: string
  /**
   * Clé représentant le contenu réel du document (ex: numéro de reçu,
   * matricule + période + appréciation...). Sans elle, `document` — recréé à
   * CHAQUE rendu du parent (frappe au clavier, requête Dexie qui se
   * réévalue...) — relance la génération du PDF en boucle, et les boutons
   * restent bloqués en "Génération..." indéfiniment. Par défaut, `fileName`
   * (déjà unique par document dans cette app) sert de clé.
   */
  depsKey?: string
}

export function PDFActions({ document, fileName, downloadLabel = 'Télécharger', depsKey }: PDFActionsProps) {
  // Ne régénère le PDF que lorsque `depsKey` (ou `fileName` à défaut) change
  // réellement — pas à chaque rendu du composant parent.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const documentStable = useMemo(() => document, [depsKey ?? fileName])

  const [instance, updateInstance] = usePDF({ document: documentStable })
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  // usePDF ne génère le PDF QU'AU MONTAGE (son effet interne a un tableau de
  // dépendances vide) : il ignore silencieusement tout changement ultérieur
  // de `document`. Sans cet effet, le PDF reste figé sur les données du tout
  // premier rendu (élève, appréciation, champs de formulaire...), sans la
  // moindre erreur visible. On appelle donc explicitement `updateInstance`
  // à chaque fois que `documentStable` change réellement.
  useEffect(() => {
    updateInstance(documentStable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentStable])

  function imprimer() {
    if (!instance.url || !iframeRef.current) return
    // Impression via iframe caché plutôt que window.open() : fonctionne de
    // façon fiable à la fois dans un navigateur classique et dans la
    // webview de l'application de bureau (où l'ouverture de nouvelles
    // fenêtres pour des URL blob: est peu fiable, voire bloquée).
    const iframe = iframeRef.current
    iframe.src = instance.url
    iframe.onload = () => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <a
        href={instance.url ?? undefined}
        download={fileName}
        aria-disabled={!instance.url}
        className={`btn-secondary ${!instance.url ? 'pointer-events-none opacity-50' : ''}`}
      >
        {instance.loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        {instance.loading ? 'Génération...' : downloadLabel}
      </a>
      <button
        type="button"
        onClick={imprimer}
        disabled={instance.loading || !instance.url}
        className="btn-secondary"
      >
        <Printer size={14} /> Imprimer
      </button>
      {instance.error && (
        <span className="flex items-center gap-1 text-xs text-danger">
          <AlertTriangle size={12} /> Échec : {instance.error}
        </span>
      )}
      {/* Caché visuellement (pas display:none, qui bloquerait l'impression dans certains navigateurs) */}
      <iframe ref={iframeRef} title="Impression" className="fixed h-0 w-0 border-0" style={{ visibility: 'hidden' }} />
    </div>
  )
}
