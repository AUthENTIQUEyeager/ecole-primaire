'use client'

import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { width: 241, height: 153, padding: 10, fontFamily: 'Helvetica', backgroundColor: '#2563eb' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  logo: { width: 16, height: 16, objectFit: 'contain' },
  ecole: { fontSize: 8, color: '#ffffff', fontWeight: 700 },
  titre: { fontSize: 10, color: '#ffffff', fontWeight: 700, marginTop: 2, marginBottom: 8 },
  card: { backgroundColor: '#ffffff', borderRadius: 4, padding: 8, flex: 1 },
  photo: { width: 32, height: 32, borderRadius: 16, marginBottom: 4, objectFit: 'cover' },
  nom: { fontSize: 11, fontWeight: 700, color: '#0f172a' },
  ligne: { fontSize: 7, color: '#64748b', marginTop: 3 },
  matricule: { fontSize: 8, fontWeight: 700, color: '#2563eb', marginTop: 6 },
})

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
    <Document>
      <Page size={[241, 153]} style={styles.page}>
        <View style={styles.headerRow}>
          {data.logoUrl && <Image src={data.logoUrl} style={styles.logo} />}
          <Text style={styles.ecole}>{data.nomEcole}</Text>
        </View>
        <Text style={styles.titre}>CARTE SCOLAIRE {data.anneeScolaire}</Text>
        <View style={styles.card}>
          {data.photoUrl && <Image src={data.photoUrl} style={styles.photo} />}
          <Text style={styles.nom}>{data.elevePrenom} {data.eleveNom}</Text>
          <Text style={styles.ligne}>Classe : {data.classe}</Text>
          <Text style={styles.matricule}>{data.matricule}</Text>
        </View>
      </Page>
    </Document>
  )
}
