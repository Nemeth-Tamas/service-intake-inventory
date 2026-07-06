export const NOTIFICATION_TEMPLATES = {
  intake: {
    key: 'intake',
    title: 'Átvettük a készüléket',
    text: 'Kedves {customerName}! A(z) {deviceType} készüléket átvettük szervizünkben. Munkalap száma: #{publicCode}. Státusz követése: {trackingUrl}'
  },
  diagnostic: {
    key: 'diagnostic',
    title: 'Diagnosztika kész',
    text: 'Kedves {customerName}! A(z) {deviceType} ({publicCode}) készülék diagnosztikája elkészült. Részletekért kérjük tekintse meg a státuszportált: {trackingUrl}'
  },
  waiting_parts: {
    key: 'waiting_parts',
    title: 'Alkatrészre vár',
    text: 'Kedves {customerName}! A(z) {deviceType} ({publicCode}) javításához szükséges alkatrész rendelése folyamatban van. Státusz: {trackingUrl}'
  },
  ready: {
    key: 'ready',
    title: 'Elkészült, átvehető',
    text: 'Kedves {customerName}! A(z) {deviceType} készüléke elkészült, átvehető szervizünkben. Munkalap száma: #{publicCode}. Státusz: {trackingUrl}'
  },
  unrepairable: {
    key: 'unrepairable',
    title: 'Javíthatatlan',
    text: 'Kedves {customerName}! Sajnálattal értesítjük, hogy a(z) {deviceType} ({publicCode}) készülék nem javítható, átvehető szervizünkben. Státusz: {trackingUrl}'
  },
  warranty_expiring: {
    key: 'warranty_expiring',
    title: 'Garancia lejár hamarosan',
    text: 'Kedves {customerName}! Értesítjük, hogy a(z) {deviceType} ({publicCode}) készülékének szervizgaranciája hamarosan lejár. Státusz: {trackingUrl}'
  }
};

export function compileTemplate(templateText: string, workOrder: any, settings: any) {
  const publicCode = workOrder.id.slice(-6).toUpperCase();
  const trackingUrl = `${settings.baseUrl}/status/${workOrder.id}`;
  
  return templateText
    .replace(/{customerName}/g, workOrder.customerName || 'Ügyfelünk')
    .replace(/{deviceType}/g, workOrder.deviceType || 'eszköz')
    .replace(/{publicCode}/g, publicCode)
    .replace(/{trackingUrl}/g, trackingUrl);
}
