'use client';

import { Printer, ReceiptText, ShieldCheck, Wrench, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ThermalWorkOrder {
  id: string;
  customerName?: string | null;
  customerContact?: string | null;
  deviceType?: string | null;
  serialNumber?: string | null;
  condition?: string | null;
  complaint?: string | null;
  accessories?: string | null;
  estimatedPrice?: string | null;
  warranty?: string | null;
  warrantyExpiry?: string | Date | null;
  status?: string | null;
  priority?: string | null;
  estimatedDone?: string | Date | null;
  createdAt?: string | Date | null;
  signatureData?: string | null;
  conditionAcceptedAt?: string | Date | null;
  lineItems?: Array<{ id?: string; description: string; amount: number }>;
  notes?: Array<{ id?: string; text: string; createdAt: string | Date }>;
  photos?: Array<{ id?: string }>;
  conditionVideos?: Array<{ id?: string; sha256?: string | null }>;
}

interface ThermalSettings {
  baseUrl?: string | null;
  logoPath?: string | null;
  workshopName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  googleReviewUrl?: string | null;
}

export default function ThermalPrinter({ workOrder, settings }: { workOrder: ThermalWorkOrder, settings: ThermalSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'ticket' | 'warranty' | 'technician'>('ticket');
  const qrRef = useRef<HTMLDivElement>(null);
  const googleQrRef = useRef<HTMLDivElement>(null);
  const techQrRef = useRef<HTMLDivElement>(null);

  const escapeHtml = (str: string | null | undefined) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrSvg = qrRef.current?.innerHTML || '';
    const googleQrSvg = googleQrRef.current?.innerHTML || '';
    const techQrSvg = techQrRef.current?.innerHTML || '';
    const dateStr = new Date().toLocaleString('hu-HU');
    const orderId = workOrder.id.slice(-6).toUpperCase();
    const logoHtml = settings.logoPath 
      ? `<img src="/api/media${settings.logoPath}" style="max-height: 53mm; max-width: 70mm; filter: grayscale(100%) contrast(125%); object-fit: contain; margin-bottom: 6mm;" />` 
      : '';

    const title = mode === 'ticket'
      ? 'ÁTVÉTELI JEGY'
      : mode === 'warranty'
        ? 'GARANCIAJEGY'
        : 'TECHNIKUS LAP';
    
    // Calculate total for warranty / technician mode
    const totalAmount = workOrder.lineItems?.reduce((acc, item) => acc + item.amount, 0) || 0;
    
    // Format Price helper
    const formatPrice = (val: string | number) => {
      const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, '')) : val;
      if (isNaN(num)) return escapeHtml(String(val));
      // Using a regular space for thousands separator to ensure printer compatibility
      return num.toLocaleString('hu-HU').replace(/\u00a0/g, ' ') + ' Ft';
    };

    const formatDateShort = (d: string | Date | null | undefined) => {
      if (!d) return '';
      const date = new Date(d);
      return date.toLocaleDateString('hu-HU') + ' ' + date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateOnly = (d: string | Date | null | undefined) => {
      if (!d) return '';
      return new Date(d).toLocaleDateString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.');
    };

    const hasVideos = workOrder.conditionVideos && workOrder.conditionVideos.length > 0;
    const hasPhotos = workOrder.photos && workOrder.photos.length > 0;
    const photoCount = workOrder.photos?.length || 0;
    const videoCount = workOrder.conditionVideos?.length || 0;

    if (mode === 'technician') {
      const manualNotes = (workOrder.notes || []).filter(
        (n) => n.text && !n.text.startsWith('[RENDSZER]')
      );
      const isUrgent = workOrder.priority === 'Sürgős' || workOrder.priority === 'Magas';
      const hasLineItems = workOrder.lineItems && workOrder.lineItems.length > 0;

      printWindow.document.write(`
        <html>
          <head>
            <title>${title} - ${orderId}</title>
            <style>
              @page { margin: 0; size: 80mm auto; }
              * { 
                box-sizing: border-box; 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
              }
              body { 
                margin: 0; 
                padding: 0; 
                width: 80mm; 
                background: white; 
                font-family: Arial, sans-serif;
                font-weight: 600;
                color: #000;
                text-rendering: geometricPrecision;
              }
              .receipt { width: 72mm; margin: 0 auto; padding: 4mm 0 6mm; }
              .tech-banner {
                background: #000;
                color: #fff;
                text-align: center;
                padding: 2.5mm 2mm;
                font-size: 13pt;
                font-weight: 900;
                letter-spacing: 0.5px;
                margin-bottom: 3mm;
              }
              .top-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 3mm;
              }
              .order-id { font-size: 18pt; font-weight: 900; font-family: monospace, Arial; color: #000; }
              .priority-badge {
                font-size: 10pt;
                font-weight: 900;
                text-transform: uppercase;
                padding: 1.5mm 2.5mm;
                border: 2px solid #000;
              }
              .priority-urgent {
                background: #000;
                color: #fff;
              }
              .divider { border-top: 2px dashed #000; margin: 3.5mm 0; padding-top: 3.5mm; }
              .section { font-size: 10.5pt; margin-bottom: 3mm; line-height: 1.35; color: #000; }
              .section-title { font-size: 9.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 1.5mm; }
              .row { margin-bottom: 1.2mm; color: #000; word-break: break-word; }
              .flex { display: flex; justify-content: space-between; gap: 2mm; }
              .bold { font-weight: 800; }
              .task-box {
                border: 2.5px solid #000;
                padding: 3mm;
                margin: 3.5mm 0;
              }
              .task-title {
                font-size: 10.5pt;
                font-weight: 900;
                text-transform: uppercase;
                border-bottom: 1.5px solid #000;
                padding-bottom: 1mm;
                margin-bottom: 2mm;
              }
              .task-body {
                font-size: 11.5pt;
                font-weight: 700;
                white-space: pre-wrap;
                word-break: break-word;
                line-height: 1.35;
              }
              .deadline-box {
                border: 2px solid #000;
                padding: 1.5mm 2.5mm;
                margin-top: 2mm;
                font-size: 10.5pt;
                font-weight: 800;
                display: flex;
                justify-content: space-between;
              }
              .note-item {
                border-left: 2.5px solid #000;
                padding-left: 2mm;
                margin-bottom: 2.5mm;
              }
              .note-date { font-size: 8.5pt; font-weight: 700; margin-bottom: 0.5mm; }
              .note-text { font-size: 10pt; white-space: pre-wrap; word-break: break-word; }
              .qr-container { text-align: center; margin: 4mm 0 2mm; }
              .qr-box { display: inline-block; border: 2px solid #000; padding: 2mm; background: #fff; }
              .qr-box svg { width: 28mm !important; height: 28mm !important; }
              .footer { text-align: center; font-size: 8.5pt; font-weight: 600; margin-top: 2mm; }
              @media print {
                body {
                  color: #000 !important;
                  font-family: Arial, sans-serif !important;
                  font-weight: 600 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .tech-banner, .priority-urgent {
                  background: #000 !important;
                  color: #fff !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="tech-banner">TECHNIKUS MUNKALAP</div>

              <div class="top-bar">
                <div class="order-id">#${orderId}</div>
                <div class="priority-badge ${isUrgent ? 'priority-urgent' : ''}">${escapeHtml(workOrder.priority || 'Normál')}</div>
              </div>

              <div class="section">
                <div class="row flex"><span>Státusz:</span><span class="bold">${escapeHtml(workOrder.status || '-')}</span></div>
                <div class="row flex"><span>Felvéve:</span><span>${formatDateShort(workOrder.createdAt)}</span></div>
                ${workOrder.estimatedDone ? `
                  <div class="deadline-box">
                    <span>HATÁRIDŐ:</span>
                    <span>${formatDateOnly(workOrder.estimatedDone)}</span>
                  </div>
                ` : ''}
              </div>

              <div class="divider"></div>

              <div class="section">
                <div class="section-title">Eszköz & Ügyfél</div>
                <div class="row"><b>Eszköz:</b> ${escapeHtml(workOrder.deviceType || 'N/A')}</div>
                ${workOrder.serialNumber ? `<div class="row"><b>S/N:</b> <span style="font-family: monospace, Arial;">${escapeHtml(workOrder.serialNumber)}</span></div>` : ''}
                <div class="row"><b>Ügyfél:</b> ${escapeHtml(workOrder.customerName || 'N/A')}</div>
                ${workOrder.customerContact ? `<div class="row"><b>Kapcsolat:</b> ${escapeHtml(workOrder.customerContact)}</div>` : ''}
              </div>

              <div class="task-box">
                <div class="task-title">Hiba / Elvégzendő feladat</div>
                <div class="task-body">${escapeHtml(workOrder.complaint || 'Nincs megadva')}</div>
              </div>

              ${(workOrder.condition || workOrder.accessories) ? `
                <div class="section divider">
                  ${workOrder.condition ? `
                    <div class="row">
                      <div class="section-title">Átvételi állapot</div>
                      <div style="white-space: pre-wrap;">${escapeHtml(workOrder.condition)}</div>
                    </div>
                  ` : ''}
                  ${workOrder.accessories ? `
                    <div class="row" style="${workOrder.condition ? 'margin-top: 2.5mm;' : ''}">
                      <div class="section-title">Tartozékok</div>
                      <div style="white-space: pre-wrap;">${escapeHtml(workOrder.accessories)}</div>
                    </div>
                  ` : ''}
                </div>
              ` : ''}

              ${(workOrder.estimatedPrice || hasLineItems || workOrder.warranty) ? `
                <div class="section divider">
                  <div class="section-title">Költség & Garancia</div>
                  ${workOrder.estimatedPrice ? `
                    <div class="row flex">
                      <span>Várható ktg:</span>
                      <span class="bold">${formatPrice(workOrder.estimatedPrice)}</span>
                    </div>
                  ` : ''}
                  ${hasLineItems ? `
                    <div style="margin-top: 2mm;">
                      ${(workOrder.lineItems || []).map((item) => `
                        <div class="row flex" style="font-size: 9.5pt;">
                          <span>• ${escapeHtml(item.description)}</span>
                          <span class="bold" style="white-space: nowrap;">${formatPrice(item.amount)}</span>
                        </div>
                      `).join('')}
                      <div class="row flex" style="border-top: 1.5px solid #000; padding-top: 1mm; margin-top: 1.5mm;">
                        <span class="bold">Tételek összesen:</span>
                        <span class="bold">${formatPrice(totalAmount)}</span>
                      </div>
                    </div>
                  ` : ''}
                  ${workOrder.warranty ? `
                    <div class="row" style="margin-top: 2mm;">
                      <b>Garancia:</b> ${escapeHtml(workOrder.warranty)}${workOrder.warrantyExpiry ? ` (Lejárat: ${formatDateOnly(workOrder.warrantyExpiry)})` : ''}
                    </div>
                  ` : ''}
                </div>
              ` : ''}

              ${manualNotes.length > 0 ? `
                <div class="section divider">
                  <div class="section-title">Jegyzetek (${manualNotes.length})</div>
                  ${manualNotes.map((note) => `
                    <div class="note-item">
                      <div class="note-date">${formatDateShort(note.createdAt)}</div>
                      <div class="note-text">${escapeHtml(note.text)}</div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <div class="section divider" style="font-size: 9.5pt;">
                <div class="row flex"><span>Nyilatkozat:</span><span class="bold">${workOrder.signatureData ? 'ALÁÍRVA ✓' : 'HIÁNYZIK ✗'}</span></div>
                <div class="row flex"><span>Állapot elfogadás:</span><span class="bold">${workOrder.conditionAcceptedAt ? 'ELFOGADVA ✓' : 'NINCS ✗'}</span></div>
                <div class="row flex"><span>Dokumentáció:</span><span class="bold">Fotó: ${photoCount} db | Videó: ${videoCount} db</span></div>
              </div>

              <div class="divider"></div>
              <div class="qr-container">
                <div class="qr-box">${techQrSvg}</div>
                <div style="font-size: 9pt; font-weight: 800; margin-top: 1.5mm;">Belső munkalap (#${orderId})</div>
              </div>
              <div class="footer">Nyomtatva: ${dateStr}</div>
            </div>
            <script>
              window.onload = () => { 
                setTimeout(() => { 
                  window.print(); 
                  window.close(); 
                }, 500); 
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }

    const conditionStatusHtml = `
      <div class="section divider">
        <div class="row"><b>Átvételi állapot:</b> ${workOrder.conditionAcceptedAt ? 'ELFOGADVA' : 'NINCS ALÁÍRVA'}</div>
        ${workOrder.conditionAcceptedAt ? `<div class="row">Aláírva: ${formatDateShort(workOrder.conditionAcceptedAt)}</div>` : ''}
        <div class="row">Videó dokumentáció: ${hasVideos ? 'VAN' : 'NINCS'}</div>
        <div class="row">Fotó dokumentáció: ${hasPhotos ? 'VAN' : 'NINCS'}</div>
        ${hasVideos ? `
          <div class="row" style="margin-top: 1mm;">
            Állapotvideók: ${videoCount} db<br/>
            ${workOrder.conditionVideos?.[0]?.sha256 ? `Videó hash: ${workOrder.conditionVideos[0].sha256.slice(0, 12)}...` : ''}
          </div>
        ` : ''}
      </div>
    `;

    const contentHtml = mode === 'ticket' ? `
      <div class="section">
        <div class="row"><b>Hiba:</b></div>
        <div class="row" style="white-space: pre-wrap;">${workOrder.complaint || 'N/A'}</div>
      </div>
      ${workOrder.estimatedPrice ? `
        <div class="section divider">
          <div class="row flex">
            <span>Várható ktg:</span>
            <span class="bold">${formatPrice(workOrder.estimatedPrice)}</span>
          </div>
        </div>
      ` : ''}
      ${conditionStatusHtml}
      <div class="section divider" style="text-align: center; font-size: 9pt; margin-top: 3mm;">
        ${workOrder.signatureData ? '✓ Nyilatkozat elfogadva és aláírva.' : '⚠ Nyilatkozat még nincs aláírva!'}
      </div>
    ` : `
      <div class="section" style="margin-top: 5mm;">
        <div class="row flex" style="font-size: 14pt;">
          <span>Összesen:</span>
          <span class="bold">${totalAmount.toLocaleString('hu-HU').replace(/\u00a0/g, ' ')} Ft</span>
        </div>
      </div>
    `;

    const qrSection = mode === 'ticket' ? `
      <div class="qr-container">
        <div class="qr-box">
          ${qrSvg}
        </div>
        <div style="font-size: 10pt; font-weight: bold; margin-top: 2mm;">Státusz követés</div>
      </div>
    ` : settings.googleReviewUrl ? `
      <div class="qr-container">
        <div class="qr-box">
          ${googleQrSvg}
        </div>
        <div style="font-size: 11pt; font-weight: bold; margin-top: 2mm;">Értékeljen minket Google-ön!</div>
      </div>
    ` : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - ${orderId}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            * { 
              box-sizing: border-box; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            body { 
              margin: 0; 
              padding: 0; 
              width: 80mm; 
              background: white; 
              font-family: Arial, sans-serif;
              font-weight: 600;
              color: #000;
              text-rendering: geometricPrecision;
            }
            @media print {
              body {
                color: #000 !important;
                font-family: Arial, sans-serif !important;
                font-weight: 600 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              * {
                color: #000 !important;
              }
            }
            .receipt { width: 72mm; margin: 0 auto; padding: 6mm 0; }
            .header { text-align: center; margin-bottom: 6mm; }
            .workshop-name { font-size: 18pt; font-weight: 800; text-transform: uppercase; margin-bottom: 2mm; color: #000; }
            .contact-info { font-size: 11pt; line-height: 1.3; font-weight: 600; color: #000; }
            .divider { border-top: 2.5px dashed #000; margin: 5mm 0; padding-top: 5mm; }
            .title-section { text-align: center; margin-bottom: 6mm; }
            .title { font-size: 17pt; font-weight: 800; margin-bottom: 2mm; color: #000; }
            .order-id { font-size: 15pt; font-weight: 800; color: #000; }
            .section { font-size: 12pt; margin-bottom: 4mm; line-height: 1.4; font-weight: 600; color: #000; }
            .row { margin-bottom: 1.5mm; color: #000; }
            .flex { display: flex; justify-content: space-between; }
            .bold { font-weight: 800; color: #000; }
            .qr-container { text-align: center; margin: 7mm 0; }
            .qr-box { display: inline-block; border: 2.5px solid #000; padding: 2.5mm; background: #fff; }
            .qr-box svg { width: 45mm !important; height: 45mm !important; }
            .footer { text-align: center; font-size: 12pt; font-weight: 700; margin-top: 6mm; color: #000; }
            .warranty-box { 
              margin-top: 5mm; 
              border: 3px solid #000; 
              padding: 4mm; 
              text-align: center;
              font-size: 13pt;
              font-weight: 700;
              color: #000;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              ${logoHtml}
              <div class="workshop-name">${settings.workshopName}</div>
              <div class="contact-info">
                ${settings.address ? `<div>${settings.address}</div>` : ''}
                ${settings.phone ? `<div>Tel: ${settings.phone}</div>` : ''}
                ${settings.email ? `<div>${settings.email}</div>` : ''}
                ${settings.website ? `<div>${settings.website}</div>` : ''}
              </div>
            </div>

            <div class="divider"></div>

            <div class="title-section">
              <div class="title">${title}</div>
              <div class="order-id">#${orderId}</div>
            </div>

            <div class="section">
              <div class="flex"><span>Dátum:</span> <span>${dateStr}</span></div>
              <div class="flex"><span>Ügyfél:</span> <span class="bold">${workOrder.customerName || 'N/A'}</span></div>
              ${workOrder.customerContact ? `<div class="flex"><span>Kapcsolat:</span> <span>${workOrder.customerContact}</span></div>` : ''}
            </div>

            <div class="divider"></div>

            <div class="section">
              <div class="flex"><span class="bold">Eszköz:</span> <span>${workOrder.deviceType || 'N/A'}</span></div>
              ${workOrder.serialNumber ? `<div class="flex"><span>S/N:</span> <span>${workOrder.serialNumber}</span></div>` : ''}
              ${mode === 'ticket' && workOrder.accessories ? `<div style="margin-top: 2mm; font-style: italic;"><b>Tartozékok:</b><br/>${workOrder.accessories}</div>` : ''}
              ${mode === 'warranty' && workOrder.warranty ? `
                <div class="warranty-box">
                  <div class="bold">GARANCIA:</div>
                  <div style="margin-top: 1mm;">${workOrder.warranty}</div>
                  ${workOrder.warrantyExpiry ? `
                    <div style="margin-top: 2mm; font-size: 10pt; border-top: 1px dashed black; padding-top: 1mm;">
                      Lejárat: ${new Date(workOrder.warrantyExpiry).toLocaleDateString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            </div>

            <div class="divider"></div>

            ${contentHtml}

            ${qrSection}

            <div class="divider"></div>
            <div class="footer">Köszönjük a bizalmát!</div>
          </div>
          <script>
            window.onload = () => { 
              setTimeout(() => { 
                window.print(); 
                window.close(); 
              }, 500); 
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const cleanBaseUrl = (settings.baseUrl || '').replace(/\/$/, '');

  return (
    <>
      {/* Hidden QRs for injection */}
      <div ref={qrRef} style={{ display: 'none' }}>
        <QRCodeSVG 
          value={`${cleanBaseUrl}/status/${workOrder.id}`} 
          size={256}
          level="M"
        />
      </div>
      <div ref={techQrRef} style={{ display: 'none' }}>
        <QRCodeSVG 
          value={`${cleanBaseUrl}/t/${workOrder.id}`} 
          size={256}
          level="M"
        />
      </div>
      {settings.googleReviewUrl && (
        <div ref={googleQrRef} style={{ display: 'none' }}>
          <QRCodeSVG 
            value={settings.googleReviewUrl} 
            size={256}
            level="H"
          />
        </div>
      )}

      <button
        onClick={() => { setMode('ticket'); setIsOpen(true); }}
        className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-black transition shadow-sm font-bold text-sm"
      >
        <Printer size={18} /> Blokki Nyomtatás
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Blokki Nyomtatás</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={28} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setMode('ticket')}
                  className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition ${mode === 'ticket' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
                >
                  <div className={`p-4 rounded-full ${mode === 'ticket' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <ReceiptText size={32} />
                  </div>
                  <div className="text-center">
                    <span className={`block font-bold ${mode === 'ticket' ? 'text-blue-700' : 'text-gray-600'}`}>Átvételi Jegy</span>
                    <span className="text-xs text-gray-400">Ügyfélnek átvételkor</span>
                  </div>
                </button>

                <button
                  onClick={() => setMode('warranty')}
                  className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition ${mode === 'warranty' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
                >
                  <div className={`p-4 rounded-full ${mode === 'warranty' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <ShieldCheck size={32} />
                  </div>
                  <div className="text-center">
                    <span className={`block font-bold ${mode === 'warranty' ? 'text-blue-700' : 'text-gray-600'}`}>Garanciajegy</span>
                    <span className="text-xs text-gray-400">Ügyfélnek kiadáskor</span>
                  </div>
                </button>

                <button
                  onClick={() => setMode('technician')}
                  className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition ${mode === 'technician' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
                >
                  <div className={`p-4 rounded-full ${mode === 'technician' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Wrench size={32} />
                  </div>
                  <div className="text-center">
                    <span className={`block font-bold ${mode === 'technician' ? 'text-blue-700' : 'text-gray-600'}`}>Technikus Lap</span>
                    <span className="text-xs text-gray-400">Műhelybe, gép mellé</span>
                  </div>
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
                <Printer className="text-amber-600 shrink-0" size={20} />
                <p className="text-xs text-amber-800 leading-relaxed">
                  A nyomtatás új ablakban fog megnyílni, amely automatikusan bezárul a folyamat befejezése után. Ügyeljen rá, hogy a böngésző ne blokkolja a felugró ablakot!
                </p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t flex gap-4">
              <button 
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 px-6 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition"
              >
                Mégse
              </button>
              <button 
                onClick={printReceipt}
                className="flex-[2] py-3 px-6 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition"
              >
                <Printer size={20} /> Nyomtatás Indítása
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
