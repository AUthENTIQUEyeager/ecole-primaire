'use client'

import { usePDF } from '@react-pdf/renderer'
import { Download, Printer, Loader2 } from 'lucide-react'

interface PDFActionsProps {
  document: React.ReactElement
  fileName: string
  downloadLabel?: string
}

export function PDFActions({ document, fileName, downloadLabel = 'Télécharger' }: PDFActionsProps) {
  const [instance] = usePDF({ document })

  function imprimer() {
    if (!instance.url) return
    const fenetre = window.open(instance.url, '_blank')
    // Laisse le PDF se charger dans le nouvel onglet avant de déclencher l'impression.
    fenetre?.addEventListener('load', () => fenetre.print())
  }

  return (
    <div className="inline-flex items-center gap-2">
      <a
        href={instance.url ?? undefined}
        download={fileName}
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
    </div>
  )
}
