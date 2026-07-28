'use client'

import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  header: { alignItems: 'center', marginBottom: 16, borderBottom: '1 solid #e2e8f0', paddingBottom: 10 },
  logo: { width: 44, height: 44, marginBottom: 6, objectFit: 'contain' },
  ecole: { fontSize: 14, fontWeight: 700 },
  sousTitre: { fontSize: 10, color: '#64748b', marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  table: { marginTop: 8 },
  tr: { flexDirection: 'row', borderBottom: '1 solid #e2e8f0' },
  th: { flex: 1, padding: 6, fontWeight: 700, backgroundColor: '#f8fafc' },
  td: { flex: 1, padding: 6 },
  moyenneBox: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', padding: 10, border: '1 solid #e2e8f0', borderRadius: 4 },
  signature: { marginTop: 50, flexDirection: 'row', justifyContent: 'space-between' },
})

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
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {data.logoUrl && <Image src={data.logoUrl} style={styles.logo} />}
          <Text style={styles.ecole}>{data.nomEcole}</Text>
          <Text style={styles.sousTitre}>Bulletin de notes — {data.periode} — Année {data.anneeScolaire}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text>Élève : {data.elevePrenom} {data.eleveNom}</Text>
          <Text>Matricule : {data.matricule}</Text>
          <Text>Classe : {data.classe}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={styles.th}>Matière</Text>
            <Text style={styles.th}>Coeff.</Text>
            <Text style={styles.th}>Moyenne /20</Text>
          </View>
          {data.lignes.map((l, i) => (
            <View style={styles.tr} key={i}>
              <Text style={styles.td}>{l.matiere}</Text>
              <Text style={styles.td}>{l.coefficient}</Text>
              <Text style={styles.td}>{l.moyenne.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.moyenneBox}>
          <Text>Moyenne générale : {data.moyenneGenerale.toFixed(2)}/20</Text>
          <Text>Rang : {data.rang}/{data.effectifClasse}</Text>
          <Text>Absences non justifiées : {data.absencesNonJustifiees}</Text>
        </View>

        {data.appreciation && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: 700, marginBottom: 4 }}>Appréciation générale</Text>
            <Text>{data.appreciation}</Text>
          </View>
        )}

        <View style={styles.signature}>
          <Text>Le Directeur</Text>
          <Text>Le Parent</Text>
        </View>
      </Page>
    </Document>
  )
}
