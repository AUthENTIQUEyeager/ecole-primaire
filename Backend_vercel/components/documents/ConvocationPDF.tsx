'use client'

const stylePage: React.CSSProperties = { fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 11, padding: '12mm', color: '#0f172a' }
const styleHeader: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }
const styleLogo: React.CSSProperties = { width: 44, height: 44, marginBottom: 6, objectFit: 'contain' }
const styleEcole: React.CSSProperties = { fontSize: 14, fontWeight: 700 }
const styleTitre: React.CSSProperties = { fontSize: 13, fontWeight: 700, margin: '14px 0', textAlign: 'center' }
const styleParagraphe: React.CSSProperties = { marginBottom: 8, lineHeight: 1.5 }
const styleRow: React.CSSProperties = { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }
const styleLabel: React.CSSProperties = { color: '#64748b' }
const styleValue: React.CSSProperties = { fontWeight: 700 }
const styleCoupon: React.CSSProperties = { marginTop: 40, borderTop: '1px dashed #94a3b8', paddingTop: 14 }
const styleCouponTitre: React.CSSProperties = { fontSize: 10, fontWeight: 700, marginBottom: 8 }

export interface ConvocationData {
  nomEcole: string
  logoUrl?: string
  directeurNom: string
  eleveNom: string
  elevePrenom: string
  classe: string
  objet: string
  date: string
  lieu: string
}

export function ConvocationDocument({ data }: { data: ConvocationData }) {
  return (
    <div style={stylePage}>
      <style>{'@page { size: A4; margin: 0; }'}</style>
      <div style={styleHeader}>
        {data.logoUrl && <img src={data.logoUrl} style={styleLogo} alt="" />}
        <div style={styleEcole}>{data.nomEcole}</div>
      </div>
      <div style={styleTitre}>CONVOCATION</div>

      <div style={styleRow}><span style={styleLabel}>Concernant</span><span style={styleValue}>{data.elevePrenom} {data.eleveNom} ({data.classe})</span></div>

      <div style={styleParagraphe}>
        Le parent ou tuteur de l'élève ci-dessus est prié de se présenter à l'école pour l'objet suivant :
      </div>
      <div style={styleRow}><span style={styleLabel}>Objet</span><span style={styleValue}>{data.objet}</span></div>
      <div style={styleRow}><span style={styleLabel}>Date</span><span style={styleValue}>{data.date}</span></div>
      <div style={styleRow}><span style={styleLabel}>Lieu</span><span style={styleValue}>{data.lieu}</span></div>

      <div style={{ marginTop: 20 }}>{data.directeurNom} — Directeur</div>

      <div style={styleCoupon}>
        <div style={styleCouponTitre}>Coupon-réponse à détacher et remettre à l'école</div>
        <div style={styleRow}><span style={styleLabel}>Élève</span><span style={styleValue}>{data.elevePrenom} {data.eleveNom}</span></div>
        <div style={{ marginTop: 10 }}>Je soussigné(e) ......................................... certifie avoir pris connaissance de cette convocation.</div>
        <div style={{ marginTop: 20 }}>Signature du parent : .........................................</div>
      </div>
    </div>
  )
}
