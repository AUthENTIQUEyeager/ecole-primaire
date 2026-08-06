'use client'

const stylePage: React.CSSProperties = { fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 11, padding: '12mm', color: '#0f172a' }
const styleHeader: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }
const styleLogo: React.CSSProperties = { width: 48, height: 48, marginBottom: 6, objectFit: 'contain' }
const styleEcole: React.CSSProperties = { fontSize: 14, fontWeight: 700, marginBottom: 2, textAlign: 'center' }
const styleAdresse: React.CSSProperties = { fontSize: 9, color: '#64748b', textAlign: 'center' }
const styleTitre: React.CSSProperties = { fontSize: 13, fontWeight: 700, margin: '14px 0', textAlign: 'center' }
const styleRow: React.CSSProperties = { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }
const styleLabel: React.CSSProperties = { color: '#64748b' }
const styleValue: React.CSSProperties = { fontWeight: 700 }
const styleBox: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 4, padding: 12, marginTop: 12 }
const styleSignature: React.CSSProperties = { marginTop: 40, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }

export interface RecuData {
  nomEcole: string
  adresseEcole: string
  logoUrl?: string
  numeroRecu: string
  eleveNom: string
  elevePrenom: string
  matricule: string
  classe: string
  tranche: number
  montant: number
  cumulPaye: number
  resteAPayer: number
  dateVersement: string
  modePaiement: string
  caissier: string
}

const LABEL_MODE: Record<string, string> = {
  especes: 'Espèces',
  mobile_money: 'Mobile Money',
  cheque: 'Chèque',
}

/**
 * Rendu HTML/CSS pur (remplace l'ancienne génération via @react-pdf/renderer,
 * peu fiable une fois packagée dans la webview Tauri). Ce composant n'est
 * jamais affiché à l'écran : il est monté dans #zone-impression par
 * ImprimerBouton au moment de l'impression, et c'est le navigateur/la
 * webview elle-même qui produit le PDF via la boîte de dialogue d'impression
 * native (« Enregistrer en PDF »).
 */
export function RecuDocument({ data }: { data: RecuData }) {
  return (
    <div style={stylePage}>
      <style>{'@page { size: A5; margin: 0; }'}</style>
      <div style={styleHeader}>
        {data.logoUrl && <img src={data.logoUrl} style={styleLogo} alt="" />}
        <div style={styleEcole}>{data.nomEcole}</div>
        <div style={styleAdresse}>{data.adresseEcole}</div>
      </div>
      <div style={styleTitre}>REÇU DE PAIEMENT — N° {data.numeroRecu}</div>

      <div style={styleRow}><span style={styleLabel}>Élève</span><span style={styleValue}>{data.elevePrenom} {data.eleveNom}</span></div>
      <div style={styleRow}><span style={styleLabel}>Matricule</span><span style={styleValue}>{data.matricule}</span></div>
      <div style={styleRow}><span style={styleLabel}>Classe</span><span style={styleValue}>{data.classe}</span></div>
      <div style={styleRow}><span style={styleLabel}>Date</span><span style={styleValue}>{data.dateVersement}</span></div>

      <div style={styleBox}>
        <div style={styleRow}><span style={styleLabel}>Tranche</span><span style={styleValue}>{data.tranche}</span></div>
        <div style={styleRow}><span style={styleLabel}>Mode de paiement</span><span style={styleValue}>{LABEL_MODE[data.modePaiement] ?? data.modePaiement}</span></div>
        <div style={styleRow}><span style={styleLabel}>Montant versé</span><span style={styleValue}>{data.montant.toLocaleString('fr-FR')} FCFA</span></div>
        <div style={styleRow}><span style={styleLabel}>Cumul payé</span><span style={styleValue}>{data.cumulPaye.toLocaleString('fr-FR')} FCFA</span></div>
        <div style={styleRow}><span style={styleLabel}>Solde restant</span><span style={styleValue}>{data.resteAPayer.toLocaleString('fr-FR')} FCFA</span></div>
      </div>

      <div style={styleSignature}>
        <span style={styleLabel}>Caissier : {data.caissier}</span>
        <span style={styleLabel}>Signature</span>
      </div>
    </div>
  )
}
