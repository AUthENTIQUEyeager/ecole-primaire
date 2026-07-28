'use client'

import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: 'Helvetica' },
  header: { alignItems: 'center', marginBottom: 20, borderBottom: '1 solid #e2e8f0', paddingBottom: 12 },
  logo: { width: 44, height: 44, marginBottom: 6, objectFit: 'contain' },
  ecole: { fontSize: 14, fontWeight: 700 },
  titre: { fontSize: 13, fontWeight: 700, marginVertical: 14, textAlign: 'center' },
  paragraphe: { marginBottom: 8, lineHeight: 1.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#64748b' },
  value: { fontWeight: 700 },
  coupon: { marginTop: 40, borderTop: '1 dashed #94a3b8', paddingTop: 14 },
  couponTitre: { fontSize: 10, fontWeight: 700, marginBottom: 8 },
})

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
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {data.logoUrl && <Image src={data.logoUrl} style={styles.logo} />}
          <Text style={styles.ecole}>{data.nomEcole}</Text>
        </View>
        <Text style={styles.titre}>CONVOCATION</Text>

        <View style={styles.row}><Text style={styles.label}>Concernant</Text><Text style={styles.value}>{data.elevePrenom} {data.eleveNom} ({data.classe})</Text></View>

        <Text style={styles.paragraphe}>
          Le parent ou tuteur de l'élève ci-dessus est prié de se présenter à l'école pour l'objet suivant :
        </Text>
        <View style={styles.row}><Text style={styles.label}>Objet</Text><Text style={styles.value}>{data.objet}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Date</Text><Text style={styles.value}>{data.date}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Lieu</Text><Text style={styles.value}>{data.lieu}</Text></View>

        <Text style={{ marginTop: 20 }}>{data.directeurNom} — Directeur</Text>

        <View style={styles.coupon}>
          <Text style={styles.couponTitre}>Coupon-réponse à détacher et remettre à l'école</Text>
          <View style={styles.row}><Text style={styles.label}>Élève</Text><Text style={styles.value}>{data.elevePrenom} {data.eleveNom}</Text></View>
          <Text style={{ marginTop: 10 }}>Je soussigné(e) ......................................... certifie avoir pris connaissance de cette convocation.</Text>
          <Text style={{ marginTop: 20 }}>Signature du parent : .........................................</Text>
        </View>
      </Page>
    </Document>
  )
}
