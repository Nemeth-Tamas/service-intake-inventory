'use client';

import { Printer, ReceiptText, ShieldCheck, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function ThermalPrinter({ workOrder, settings }: { workOrder: any, settings: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'ticket' | 'warranty'>('ticket');
  const qrRef = useRef<HTMLDivElement>(null);
  const googleQrRef = useRef<HTMLDivElement>(null);

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrSvg = qrRef.current?.innerHTML || '';
    const googleQrSvg = googleQrRef.current?.innerHTML || '';
    const dateStr = new Date().toLocaleString('hu-HU');
    const orderId = workOrder.id.slice(-6).toUpperCase();
    const logoHtml = settings.logoPath 
      ? `<img src="/api/media${settings.logoPath}" style="max-height: 35mm; max-width: 65mm; filter: grayscale(100%); margin-bottom: 5mm;" />` 
      : '';

    const title = mode === 'ticket' ? 'ÁTVÉTELI JEGY' : 'GARANCIAJEGY';
    
    // Calculate total for warranty mode
    const totalAmount = workOrder.lineItems?.reduce((acc: number, item: any) => acc + item.amount, 0) || 0;
    
    // Format Price helper
    const formatPrice = (val: string | number) => {
      const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, '')) : val;
      if (isNaN(num)) return val;
      // Using a regular space for thousands separator to ensure printer compatibility
      return num.toLocaleString('hu-HU').replace(/\u00a0/g, ' ') + ' Ft';
    };

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
      <div class="section divider" style="text-align: center; font-size: 9pt; margin-top: 5mm;">
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
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { 
              margin: 0; 
              padding: 0; 
              width: 80mm; 
              background: white; 
              font-family: 'Courier New', Courier, monospace;
              color: black;
            }
            .receipt { width: 72mm; margin: 0 auto; padding: 5mm 0; }
            .header { text-align: center; margin-bottom: 5mm; }
            .workshop-name { font-size: 17pt; font-weight: bold; text-transform: uppercase; margin-bottom: 2mm; }
            .contact-info { font-size: 10pt; line-height: 1.2; }
            .divider { border-top: 3px dashed black; margin: 4mm 0; padding-top: 4mm; }
            .title-section { text-align: center; margin-bottom: 5mm; }
            .title { font-size: 15pt; font-weight: bold; margin-bottom: 1mm; }
            .order-id { font-size: 12pt; font-weight: bold; }
            .section { font-size: 11pt; margin-bottom: 3mm; line-height: 1.3; }
            .row { margin-bottom: 1mm; }
            .flex { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
            .qr-container { text-align: center; margin: 8mm 0; }
            .qr-box { display: inline-block; border: 1.5px solid black; padding: 2mm; }
            .qr-box svg { width: 40mm !important; height: 40mm !important; }
            .footer { text-align: center; font-size: 11pt; font-style: italic; margin-top: 5mm; }
            .warranty-box { 
              margin-top: 4mm; 
              border: 3px solid black; 
              padding: 3mm; 
              text-align: center;
              font-size: 12pt;
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

  return (
    <>
      {/* Hidden QRs for injection */}
      <div ref={qrRef} style={{ display: 'none' }}>
        <QRCodeSVG 
          value={`${settings.baseUrl}/status/${workOrder.id}`} 
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
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Blokki Nyomtatás</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={28} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('ticket')}
                  className={`flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition ${mode === 'ticket' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
                >
                  <div className={`p-4 rounded-full ${mode === 'ticket' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <ReceiptText size={32} />
                  </div>
                  <span className={`font-bold ${mode === 'ticket' ? 'text-blue-700' : 'text-gray-500'}`}>Átvételi Jegy</span>
                </button>

                <button
                  onClick={() => setMode('warranty')}
                  className={`flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition ${mode === 'warranty' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
                >
                  <div className={`p-4 rounded-full ${mode === 'warranty' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <ShieldCheck size={32} />
                  </div>
                  <span className={`font-bold ${mode === 'warranty' ? 'text-blue-700' : 'text-gray-500'}`}>Garanciajegy</span>
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
