'use client'

import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: 'Helvetica' },
  header: { alignItems: 'center', marginBottom: 20, borderBottom: '1 solid #e2e8f0', paddingBottom: 12 },
  logo: { width: 44, height: 44, marginBottom: 6, objectFit: 'contain' },
  ecole: { fontSize: 14, fontWeight: 700 },
  titre: { fontSize: 13, fontWeight: 700, marginVertical: 14, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: '#64748b' },
  value: { fontWeight: 700 },
  signature: { marginTop: 50, flexDirection: 'row', justifyContent: 'space-between' },
})

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
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          {data.logoUrl && <Image src={data.logoUrl} style={styles.logo} />}
          <Text style={styles.ecole}>{data.nomEcole}</Text>
        </View>
        <Text style={styles.titre}>
          BILLET {data.type === 'absence' ? "D'ABSENCE" : 'DE RETARD'}
        </Text>
        <View style={styles.row}><Text style={styles.label}>Élève</Text><Text style={styles.value}>{data.elevePrenom} {data.eleveNom}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Classe</Text><Text style={styles.value}>{data.classe}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Date</Text><Text style={styles.value}>{data.dateAbsence}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Statut</Text><Text style={styles.value}>{data.justifiee ? 'Justifiée' : 'Non justifiée'}</Text></View>
        {data.motif && (
          <View style={styles.row}><Text style={styles.label}>Motif</Text><Text style={styles.value}>{data.motif}</Text></View>
        )}
        <View style={styles.signature}>
          <Text style={styles.label}>Le Directeur</Text>
          <Text style={styles.label}>Le Parent</Text>
        </View>
      </Page>
    </Document>
  )
}
