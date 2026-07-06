import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import path from 'path';

// Register Roboto font to support Hungarian accent characters (Ő, Ű)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: path.join(process.cwd(), 'public/fonts/Roboto-Regular.ttf'), fontWeight: 'normal' },
    { src: path.join(process.cwd(), 'public/fonts/Roboto-Bold.ttf'), fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    padding: 30,
    fontSize: 10,
    color: '#334155',
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
    paddingBottom: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 45,
    height: 45,
    objectFit: 'contain',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  headerSub: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
    marginTop: 2,
  },
  headerMeta: {
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
    marginBottom: 8,
  },
  cardRow: {
    marginBottom: 4,
    flexDirection: 'row',
  },
  label: {
    fontWeight: 'bold',
    width: 75,
  },
  value: {
    flex: 1,
  },
  alertCard: {
    marginBottom: 20,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderRadius: 6,
    padding: 12,
  },
  alertTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    paddingBottom: 4,
    marginBottom: 8,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableCellHeader: {
    padding: 6,
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 6,
  },
  notesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    borderBottomWidth: 1,
    borderBottomColor: '#1e40af',
    paddingBottom: 3,
    marginBottom: 8,
  },
  noteItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#cbd5e1',
    paddingLeft: 10,
    paddingVertical: 4,
    backgroundColor: '#f8fafc',
    marginBottom: 6,
  },
  noteMeta: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 2,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  photoCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#ffffff',
  },
  photoImg: {
    width: '100%',
    height: 180,
    objectFit: 'contain',
    marginBottom: 6,
  },
  photoMeta: {
    fontSize: 8,
    color: '#94a3b8',
    marginBottom: 2,
  },
  photoDesc: {
    fontSize: 9,
    color: '#334155',
  },
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  // Declaration styling
  declarationText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#334155',
    padding: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
  },
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  signatureBox: {
    width: '45%',
    alignItems: 'center',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  signatureImg: {
    maxHeight: 50,
    maxWidth: 180,
    objectFit: 'contain',
  },
});

function cleanDeclarationText(html: string) {
  if (!html) return '';
  return html
    .replace(/<p[^>]*>/g, '')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<ul[^>]*>/g, '')
    .replace(/<\/ul>/g, '\n')
    .replace(/<li[^>]*>/g, '• ')
    .replace(/<\/li>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]*>/g, '') // strip any other tags
    .trim();
}

interface WorkOrderDocProps {
  workOrder: any;
  settings: any;
}

export const WorkOrderDocument = ({ workOrder, settings }: WorkOrderDocProps) => {
  const logoUrl = settings.logoPath; // base64 source pre-processed
  const formatDate = (date: Date | string) => new Date(date).toLocaleString('hu-HU');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.logo} />
            ) : null}
            <View>
              <Text style={styles.headerTitle}>SZERVIZ JEGYZŐKÖNYV</Text>
              <Text style={styles.headerSub}>{settings.workshopName}</Text>
            </View>
          </View>
          <View style={styles.headerMeta}>
            <Text>Munkalap: {workOrder.id.slice(-6).toUpperCase()}</Text>
            <Text>Dátum: {formatDate(new Date())}</Text>
          </View>
        </View>

        {/* Grid: Client & Device */}
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ügyfél Adatok</Text>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Név:</Text>
              <Text style={styles.value}>{workOrder.customerName || '-'}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Elérhetőség:</Text>
              <Text style={styles.value}>{workOrder.customerContact || '-'}</Text>
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Eszköz Adatok</Text>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Típus:</Text>
              <Text style={styles.value}>{workOrder.deviceType || '-'}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Sorozatszám:</Text>
              <Text style={styles.value}>{workOrder.serialNumber || '-'}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Státusz:</Text>
              <Text style={[styles.value, { fontWeight: 'bold', color: '#1e40af' }]}>{workOrder.status}</Text>
            </View>
          </View>
        </View>

        {/* Alert Card: Fault/Condition */}
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>Állapot és Hiba</Text>
          <View style={{ marginBottom: 4 }}>
            <Text style={{ fontWeight: 'bold' }}>Eszköz állapota:</Text>
            <Text style={{ marginTop: 2 }}>{workOrder.condition || 'Nincs leírás'}</Text>
          </View>
          <View>
            <Text style={{ fontWeight: 'bold' }}>Bejelentett hiba:</Text>
            <Text style={{ marginTop: 2 }}>{workOrder.complaint || 'Nincs hiba leírás'}</Text>
          </View>
        </View>

        {/* Status History */}
        {workOrder.statusHistory && workOrder.statusHistory.length > 0 && (
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.sectionTitle}>Státusz Történet</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellHeader, { width: '40%' }]}>Dátum</Text>
                <Text style={[styles.tableCellHeader, { width: '60%' }]}>Státusz</Text>
              </View>
              {workOrder.statusHistory.map((log: any) => (
                <View key={log.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '40%' }]}>{formatDate(log.createdAt)}</Text>
                  <Text style={[styles.tableCell, { width: '60%', fontWeight: 'bold' }]}>{log.status}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {workOrder.notes && workOrder.notes.length > 0 && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Munkalap Jegyzetek</Text>
            {workOrder.notes.map((note: any) => (
              <View key={note.id} style={styles.noteItem}>
                <Text style={styles.noteMeta}>{formatDate(note.createdAt)}</Text>
                <Text>{note.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ fontWeight: 'bold', fontSize: 10, color: '#111111' }}>{settings.workshopName}</Text>
          {settings.technicianName && <Text style={{ color: '#666666', marginTop: 2 }}>Technikus: {settings.technicianName}</Text>}
          <Text style={[styles.footerText, { marginTop: 6 }]}>Generálva a Szerviz Kezelő alkalmazással • {formatDate(new Date())}</Text>
        </View>
      </Page>

      {/* Render Photos if any */}
      {workOrder.photos && workOrder.photos.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Csatolt Fotók</Text>
          <View style={styles.photosContainer}>
            {workOrder.photos.map((p: any) => {
              return (
                <View key={p.id} style={styles.photoCard}>
                  {p.base64Src ? (
                    <Image src={p.base64Src} style={styles.photoImg} />
                  ) : null}
                  <Text style={styles.photoMeta}>{formatDate(p.createdAt)}</Text>
                  <Text style={styles.photoDesc}>{p.description || 'Nincs leírás'}</Text>
                </View>
              );
            })}
          </View>
        </Page>
      )}

      {/* Render Declaration if signed */}
      {workOrder.signatureData && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              {logoUrl ? (
                <Image src={logoUrl} style={styles.logo} />
              ) : null}
              <View>
                <Text style={styles.headerTitle}>NYILATKOZAT</Text>
                <Text style={styles.headerSub}>{settings.workshopName}</Text>
              </View>
            </View>
            <View style={styles.headerMeta}>
              <Text>Munkalap: {workOrder.id.slice(-6).toUpperCase()}</Text>
              <Text>Dátum: {formatDate(workOrder.signedAt || new Date())}</Text>
            </View>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>NYILATKOZAT SZÖVEGE</Text>
            <Text style={styles.declarationText}>
              {cleanDeclarationText(workOrder.signedDeclarationText || settings.declarationTemplate)}
            </Text>
          </View>

          {/* Signatures */}
          <View style={styles.signaturesContainer}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine}>
                <Image src={workOrder.signatureData} style={styles.signatureImg} />
              </View>
              <Text style={{ fontWeight: 'bold' }}>Ügyfél aláírása</Text>
              <Text style={styles.photoMeta}>Digitálisan rögzítve: {formatDate(workOrder.signedAt)}</Text>
            </View>

            <View style={styles.signatureBox}>
              <View style={styles.signatureLine}>
                {settings.representativeSignature ? (
                  <Image src={settings.representativeSignature} style={styles.signatureImg} />
                ) : (
                  <Text style={{ fontWeight: 'bold', color: '#1e40af' }}>{settings.workshopName}</Text>
                )}
              </View>
              <Text style={{ fontWeight: 'bold' }}>{settings.workshopName} képviseletében</Text>
            </View>
          </View>

          <View style={[styles.footer, { marginTop: 60 }]}>
            <Text style={[styles.footerText, { textAlign: 'center', lineHeight: 1.4 }]}>
              Ez a dokumentum a(z) {settings.workshopName} szervizkezelő rendszerével készült.
              A digitális aláírás a felek által elfogadott, jogilag kötőerejű nyilatkozatnak minősül.
            </Text>
          </View>
        </Page>
      )}
    </Document>
  );
};

export const DeclarationDocument = ({ workOrder, settings }: WorkOrderDocProps) => {
  const logoUrl = settings.logoPath; // base64 source pre-processed
  const formatDate = (date: Date | string) => new Date(date).toLocaleString('hu-HU');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.logo} />
            ) : null}
            <View>
              <Text style={styles.headerTitle}>NYILATKOZAT</Text>
              <Text style={styles.headerSub}>{settings.workshopName}</Text>
            </View>
          </View>
          <View style={styles.headerMeta}>
            <Text>Munkalap: {workOrder.id.slice(-6).toUpperCase()}</Text>
            <Text>Dátum: {formatDate(workOrder.signedAt || new Date())}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ügyfél és Eszköz Adatok</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '48%' }}>
              <View style={styles.cardRow}>
                <Text style={styles.label}>Név:</Text>
                <Text style={styles.value}>{workOrder.customerName || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.label}>Elérhetőség:</Text>
                <Text style={styles.value}>{workOrder.customerContact || '-'}</Text>
              </View>
            </View>
            <View style={{ width: '48%' }}>
              <View style={styles.cardRow}>
                <Text style={styles.label}>Eszköz:</Text>
                <Text style={styles.value}>{workOrder.deviceType || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.label}>Sorozatszám:</Text>
                <Text style={styles.value}>{workOrder.serialNumber || '-'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 20, marginBottom: 40 }}>
          <Text style={styles.sectionTitle}>NYILATKOZAT SZÖVEGE</Text>
          <Text style={styles.declarationText}>
            {cleanDeclarationText(workOrder.signedDeclarationText || settings.declarationTemplate)}
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signaturesContainer}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              {workOrder.signatureData ? (
                <Image src={workOrder.signatureData} style={styles.signatureImg} />
              ) : (
                <Text style={{ color: '#cbd5e1', fontSize: 10 }}>Nincs aláírás</Text>
              )}
            </View>
            <Text style={{ fontWeight: 'bold' }}>Ügyfél aláírása</Text>
            <Text style={styles.photoMeta}>Digitálisan rögzítve: {formatDate(workOrder.signedAt || new Date())}</Text>
          </View>

          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              {settings.representativeSignature ? (
                <Image src={settings.representativeSignature} style={styles.signatureImg} />
              ) : (
                <Text style={{ fontWeight: 'bold', color: '#1e40af' }}>{settings.workshopName}</Text>
              )}
            </View>
            <Text style={{ fontWeight: 'bold' }}>{settings.workshopName} képviseletében</Text>
          </View>
        </View>

        <View style={[styles.footer, { marginTop: 80 }]}>
          <Text style={[styles.footerText, { textAlign: 'center', lineHeight: 1.4 }]}>
            Ez a dokumentum a(z) {settings.workshopName} szervizkezelő rendszerével készült.
            A digitális aláírás a felek által elfogadott, jogilag kötőerejű nyilatkozatnak minősül.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
