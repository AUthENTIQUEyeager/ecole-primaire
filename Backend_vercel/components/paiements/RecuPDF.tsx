'use client'

import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: 'Helvetica' },
  header: { alignItems: 'center', marginBottom: 20, borderBottom: '1 solid #e2e8f0', paddingBottom: 12 },
  logo: { width: 48, height: 48, marginBottom: 6, objectFit: 'contain' },
  ecole: { fontSize: 14, fontWeight: 700, marginBottom: 2, textAlign: 'center' },
  adresse: { fontSize: 9, color: '#64748b', textAlign: 'center' },
  titre: { fontSize: 13, fontWeight: 700, marginVertical: 14, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#64748b' },
  value: { fontWeight: 700 },
  box: { border: '1 solid #e2e8f0', borderRadius: 4, padding: 12, marginTop: 12 },
  signature: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' },
})

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

export function RecuDocument({ data }: { data: RecuData }) {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          {data.logoUrl && <Image src={data.logoUrl} style={styles.logo} />}
          <Text style={styles.ecole}>{data.nomEcole}</Text>
          <Text style={styles.adresse}>{data.adresseEcole}</Text>
        </View>
        <Text style={styles.titre}>REÇU DE PAIEMENT — N° {data.numeroRecu}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Élève</Text>
          <Text style={styles.value}>{data.elevePrenom} {data.eleveNom}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Matricule</Text>
          <Text style={styles.value}>{data.matricule}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Classe</Text>
          <Text style={styles.value}>{data.classe}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{data.dateVersement}</Text>
        </View>

        <View style={styles.box}>
          <View style={styles.row}>
            <Text style={styles.label}>Tranche</Text>
            <Text style={styles.value}>{data.tranche}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mode de paiement</Text>
            <Text style={styles.value}>{LABEL_MODE[data.modePaiement] ?? data.modePaiement}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Montant versé</Text>
            <Text style={styles.value}>{data.montant.toLocaleString('fr-FR')} FCFA</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Cumul payé</Text>
            <Text style={styles.value}>{data.cumulPaye.toLocaleString('fr-FR')} FCFA</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Solde restant</Text>
            <Text style={styles.value}>{data.resteAPayer.toLocaleString('fr-FR')} FCFA</Text>
          </View>
        </View>

        <View style={styles.signature}>
          <Text style={styles.label}>Caissier : {data.caissier}</Text>
          <Text style={styles.label}>Signature</Text>
        </View>
      </Page>
    </Document>
  )
}
