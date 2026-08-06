'use client'

const stylePage: React.CSSProperties = { width: '85.6mm', height: '53.98mm', padding: '3.5mm', fontFamily: 'Helvetica, Arial, sans-serif', backgroundColor: '#2563eb', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }
const styleHeaderRow: React.CSSProperties = { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }
const styleLogo: React.CSSProperties = { width: 16, height: 16, objectFit: 'contain' }
const styleEcole: React.CSSProperties = { fontSize: 8, color: '#ffffff', fontWeight: 700 }
const styleTitre: React.CSSProperties = { fontSize: 10, color: '#ffffff', fontWeight: 700, marginTop: 2, marginBottom: 8 }
const styleCard: React.CSSProperties = { backgroundColor: '#ffffff', borderRadius: 4, padding: 8, flex: 1 }
const stylePhoto: React.CSSProperties = { width: 32, height: 32, borderRadius: 16, marginBottom: 4, objectFit: 'cover' }
const styleNom: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#0f172a' }
const styleLigne: React.CSSProperties = { fontSize: 7, color: '#64748b', marginTop: 3 }
const styleMatricule: React.CSSProperties = { fontSize: 8, fontWeight: 700, color: '#2563eb', marginTop: 6 }

export interface CarteData {
  nomEcole: string
  logoUrl?: string
  photoUrl?: string
  eleveNom: string
  elevePrenom: string
  classe: string
  matricule: string
  anneeScolaire: string
}

export function CarteDocument({ data }: { data: CarteData }) {
  return (
    <div style={stylePage}>
      <style>{'@page { size: 85.6mm 53.98mm; margin: 0; }'}</style>
      <div style={styleHeaderRow}>
        {data.logoUrl && <img src={data.logoUrl} style={styleLogo} alt="" />}
        <div style={styleEcole}>{data.nomEcole}</div>
      </div>
      <div style={styleTitre}>CARTE SCOLAIRE {data.anneeScolaire}</div>
      <div style={styleCard}>
        {data.photoUrl && <img src={data.photoUrl} style={stylePhoto} alt="" />}
        <div style={styleNom}>{data.elevePrenom} {data.eleveNom}</div>
        <div style={styleLigne}>Classe : {data.classe}</div>
        <div style={styleMatricule}>{data.matricule}</div>
      </div>
    </div>
  )
}
