export const NOTIFICATION_TEMPLATES = {
  intake: {
    key: 'intake',
    title: 'Átvettük a készüléket',
    text: 'Kedves {customerName}! A(z) {deviceType} készüléket átvettük. Munkalap: #{publicCode}. Státusz: {trackingUrl}'
  },
  diagnostic: {
    key: 'diagnostic',
    title: 'Diagnosztika kész',
    text: 'Kedves {customerName}! A(z) {deviceType} ({publicCode}) diagnosztikája kész. Részletek: {trackingUrl}'
  },
  waiting_parts: {
    key: 'waiting_parts',
    title: 'Alkatrészre vár',
    text: 'Kedves {customerName}! A(z) {deviceType} ({publicCode}) javításához alkatrészre várunk. Státusz: {trackingUrl}'
  },
  ready: {
    key: 'ready',
    title: 'Elkészült, átvehető',
    text: 'Kedves {customerName}! A(z) {deviceType} ({publicCode}) elkészült, átvehető. Státusz: {trackingUrl}'
  },
  unrepairable: {
    key: 'unrepairable',
    title: 'Javíthatatlan',
    text: 'Kedves {customerName}! A(z) {deviceType} ({publicCode}) sajnos nem javítható, átvehető. Státusz: {trackingUrl}'
  },
  warranty_expiring: {
    key: 'warranty_expiring',
    title: 'Garancia lejár hamarosan',
    text: 'Kedves {customerName}! A(z) {deviceType} ({publicCode}) szervizgaranciája hamarosan lejár. Státusz: {trackingUrl}'
  }
};

export function compileTemplate(templateText: string, workOrder: any, settings: any) {
  const publicCode = workOrder.id.slice(-6).toUpperCase();
  const shortId = workOrder.id.slice(-6).toLowerCase();
  const trackingUrl = `${settings.baseUrl}/status/${shortId}`;
  
  return templateText
    .replace(/{customerName}/g, workOrder.customerName || 'Ügyfelünk')
    .replace(/{deviceType}/g, workOrder.deviceType || 'eszköz')
    .replace(/{publicCode}/g, publicCode)
    .replace(/{trackingUrl}/g, trackingUrl);
}
