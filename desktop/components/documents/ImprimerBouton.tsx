'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, Loader2 } from 'lucide-react'

interface ImprimerBoutonProps {
  /** Contenu imprimable — un des composants *Document (RecuDocument, BulletinDocument, ...). */
  document: React.ReactElement
  /** Nom de fichier suggéré (avec ou sans .pdf) — utilisé comme titre de la page
   *  pendant l'impression, ce que la plupart des boîtes de dialogue « Imprimer »
   *  reprennent comme nom de fichier par défaut pour « Enregistrer en PDF ». */
  fileName: string
  /** Texte du bouton. Par défaut « Imprimer ». */
  downloadLabel?: string
}

/**
 * Remplace l'ancien PDFActions (généré via @react-pdf/renderer, peu fiable
 * une fois packagé dans la webview Tauri). Ici, aucune génération binaire :
 * le document (déjà du HTML/CSS) est monté dans #zone-impression (voir
 * app/layout.tsx) au moment du clic, puis on délègue à window.print() —
 * géré nativement par la webview, qui propose « Enregistrer en PDF » comme
 * n'importe quelle imprimante. C'est ce même mécanisme qui gère à la fois
 * l'impression physique et la sauvegarde PDF, d'où un seul bouton.
 */
export function ImprimerBouton({ document: contenu, fileName, downloadLabel = 'Imprimer' }: ImprimerBoutonProps) {
  const [actif, setActif] = useState(false)
  const [zone, setZone] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setZone(window.document.getElementById('zone-impression'))
  }, [])

  useEffect(() => {
    if (!actif) return
    const titreOriginal = window.document.title
    window.document.title = fileName.replace(/\.pdf$/i, '')

    const nettoyer = () => {
      window.document.title = titreOriginal
      setActif(false)
    }

    // On laisse le navigateur peindre le contenu qui vient d'être porté dans
    // #zone-impression avant d'ouvrir la boîte de dialogue d'impression.
    const frame = requestAnimationFrame(() => {
      window.print()
      // window.print() bloque l'exécution tant que la boîte de dialogue est
      // ouverte dans la quasi-totalité des navigateurs/webviews ; on nettoie
      // donc juste après, en plus de l'événement 'afterprint' en secours
      // pour les environnements où l'appel serait asynchrone.
      nettoyer()
    })
    window.addEventListener('afterprint', nettoyer)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('afterprint', nettoyer)
    }
  }, [actif, fileName])

  return (
    <>
      <button
        type="button"
        onClick={() => setActif(true)}
        disabled={actif}
        className="btn-secondary"
      >
        {actif ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
        {downloadLabel}
      </button>
      {actif && zone ? createPortal(contenu, zone) : null}
    </>
  )
}
