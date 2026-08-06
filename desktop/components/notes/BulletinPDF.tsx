'use client'

const stylePage: React.CSSProperties = { fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 10, padding: '12mm', color: '#0f172a' }
const styleHeader: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }
const styleLogo: React.CSSProperties = { width: 44, height: 44, marginBottom: 6, objectFit: 'contain' }
const styleEcole: React.CSSProperties = { fontSize: 14, fontWeight: 700 }
const styleSousTitre: React.CSSProperties = { fontSize: 10, color: '#64748b', marginTop: 2 }
const styleInfoRow: React.CSSProperties = { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }
const styleTable: React.CSSProperties = { marginTop: 8, width: '100%', borderCollapse: 'collapse' }
const styleTr: React.CSSProperties = { display: 'flex', flexDirection: 'row', borderBottom: '1px solid #e2e8f0' }
const styleTh: React.CSSProperties = { flex: 1, padding: 6, fontWeight: 700, backgroundColor: '#f8fafc' }
const styleTd: React.CSSProperties = { flex: 1, padding: 6 }
const styleMoyenneBox: React.CSSProperties = { marginTop: 14, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: 10, border: '1px solid #e2e8f0', borderRadius: 4 }
const styleSignature: React.CSSProperties = { marginTop: 50, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }

export interface BulletinData {
  nomEcole: string
  logoUrl?: string
  anneeScolaire: string
  eleveNom: string
  elevePrenom: string
  matricule: string
  classe: string
  periode: string
  lignes: { matiere: string; coefficient: number; moyenne: number }[]
  moyenneGenerale: number
  rang: number
  effectifClasse: number
  absencesNonJustifiees: number
  appreciation?: string
}

export function BulletinDocument({ data }: { data: BulletinData }) {
  return (
    <div style={stylePage}>
      <style>{'@page { size: A4; margin: 0; }'}</style>
      <div style={styleHeader}>
        {data.logoUrl && <img src={data.logoUrl} style={styleLogo} alt="" />}
        <div style={styleEcole}>{data.nomEcole}</div>
        <div style={styleSousTitre}>Bulletin de notes — {data.periode} — Année {data.anneeScolaire}</div>
      </div>

      <div style={styleInfoRow}>
        <span>Élève : {data.elevePrenom} {data.eleveNom}</span>
        <span>Matricule : {data.matricule}</span>
        <span>Classe : {data.classe}</span>
      </div>

      <div style={styleTable}>
        <div style={styleTr}>
          <span style={styleTh}>Matière</span>
          <span style={styleTh}>Coeff.</span>
          <span style={styleTh}>Moyenne /20</span>
        </div>
        {data.lignes.map((l, i) => (
          <div style={styleTr} key={i}>
            <span style={styleTd}>{l.matiere}</span>
            <span style={styleTd}>{l.coefficient}</span>
            <span style={styleTd}>{l.moyenne.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div style={styleMoyenneBox}>
        <span>Moyenne générale : {data.moyenneGenerale.toFixed(2)}/20</span>
        <span>Rang : {data.rang}/{data.effectifClasse}</span>
        <span>Absences non justifiées : {data.absencesNonJustifiees}</span>
      </div>

      {data.appreciation && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Appréciation générale</div>
          <div>{data.appreciation}</div>
        </div>
      )}

      <div style={styleSignature}>
        <span>Le Directeur</span>
        <span>Le Parent</span>
      </div>
    </div>
  )
}
