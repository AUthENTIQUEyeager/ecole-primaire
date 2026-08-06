'use client'

const stylePage: React.CSSProperties = { fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 11, padding: '12mm', color: '#0f172a' }
const styleHeader: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }
const styleLogo: React.CSSProperties = { width: 44, height: 44, marginBottom: 6, objectFit: 'contain' }
const styleEcole: React.CSSProperties = { fontSize: 14, fontWeight: 700 }
const styleTitre: React.CSSProperties = { fontSize: 13, fontWeight: 700, margin: '14px 0', textAlign: 'center' }
const styleRow: React.CSSProperties = { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }
const styleLabel: React.CSSProperties = { color: '#64748b' }
const styleValue: React.CSSProperties = { fontWeight: 700 }
const styleSignature: React.CSSProperties = { marginTop: 50, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }

export interface BilletData {
  nomEcole: string
  logoUrl?: string
  eleveNom: string
  elevePrenom: string
  classe: string
  dateAbsence: string
  type: 'absence' | 'retard'
  justifiee: boolean
  motif?: string
}

export function BilletDocument({ data }: { data: BilletData }) {
  return (
    <div style={stylePage}>
      <style>{'@page { size: A5; margin: 0; }'}</style>
      <div style={styleHeader}>
        {data.logoUrl && <img src={data.logoUrl} style={styleLogo} alt="" />}
        <div style={styleEcole}>{data.nomEcole}</div>
      </div>
      <div style={styleTitre}>BILLET {data.type === 'absence' ? "D'ABSENCE" : 'DE RETARD'}</div>
      <div style={styleRow}><span style={styleLabel}>Élève</span><span style={styleValue}>{data.elevePrenom} {data.eleveNom}</span></div>
      <div style={styleRow}><span style={styleLabel}>Classe</span><span style={styleValue}>{data.classe}</span></div>
      <div style={styleRow}><span style={styleLabel}>Date</span><span style={styleValue}>{data.dateAbsence}</span></div>
      <div style={styleRow}><span style={styleLabel}>Statut</span><span style={styleValue}>{data.justifiee ? 'Justifiée' : 'Non justifiée'}</span></div>
      {data.motif && (
        <div style={styleRow}><span style={styleLabel}>Motif</span><span style={styleValue}>{data.motif}</span></div>
      )}
      <div style={styleSignature}>
        <span style={styleLabel}>Le Directeur</span>
        <span style={styleLabel}>Le Parent</span>
      </div>
    </div>
  )
}
