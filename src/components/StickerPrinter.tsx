'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Tag } from 'lucide-react';
import { useRef } from 'react';

interface Props {
  workOrder: any;
  baseUrl: string;
  logoPath?: string | null;
  workshopName: string;
}

export default function StickerPrinter({ workOrder, baseUrl, logoPath, workshopName }: Props) {
  const qrRef = useRef<HTMLDivElement>(null);

  const printSticker = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const qrUrl = `${cleanBaseUrl}/t/${workOrder.id}`;
    const qrSvg = qrRef.current?.innerHTML || '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Címke: ${workOrder.id.slice(-6).toUpperCase()}</title>
          <style>
            @page { margin: 0; size: 60mm 40mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            html, body { margin: 0; padding: 0; width: 60mm; height: 40mm; background: white; overflow: hidden; }
            .sticker-container { width: 60mm; height: 40mm; padding: 3mm; display: flex; align-items: center; font-family: 'Arial', sans-serif; }
            .qr-side { width: 28mm; height: 28mm; flex-shrink: 0; display: flex; align-items: center; justify-content: center; position: relative; }
            .qr-side svg { width: 100% !important; height: 100% !important; }
            .logo-overlay { position: absolute; width: 7mm; height: 7mm; background: white; padding: 0.3mm; border-radius: 1mm; z-index: 10; top: 50%; left: 50%; transform: translate(-50%, -50%); border: 0.3mm solid #fff; }
            .info-side { flex: 1; height: 34mm; display: flex; flex-direction: column; padding-left: 2mm; overflow: hidden; justify-content: space-between; border-left: 1px solid #eee; }
            .workshop-tag { font-size: 6pt; color: #666; font-weight: bold; text-transform: uppercase; margin-bottom: 0.5mm; }
            .id-header { border-bottom: 1.5pt solid #000; padding-bottom: 0.5mm; margin-bottom: 1mm; }
            .id-text { font-size: 13pt; font-weight: 900; font-family: monospace; letter-spacing: -0.2mm; }
            .details { flex-grow: 1; display: flex; flex-direction: column; gap: 0.3mm; justify-content: center; }
            .text { font-size: 7pt; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #000; font-weight: bold; max-width: 25mm; }
            .priority-box { font-size: 8pt; font-weight: 900; text-transform: uppercase; border: 1.5px solid #000; padding: 0.5mm 2mm; align-self: flex-start; background: #000 !important; color: #fff !important; }
          </style>
        </head>
        <body>
          <div class="sticker-container">
            <div class="qr-side">
              ${qrSvg}
              ${logoPath ? `<img src="/api/media${logoPath}" class="logo-overlay" />` : ''}
            </div>
            <div class="info-side">
              <div>
                <div class="workshop-tag">${workshopName.substring(0, 20)}</div>
                <div class="id-header">
                  <div class="id-text">${workOrder.id.slice(-6).toUpperCase()}</div>
                </div>
              </div>
              <div class="details">
                <div class="text">UGYFEL: ${workOrder.customerName || '-'}</div>
                <div class="text">TIPUS: ${workOrder.deviceType || '-'}</div>
                <div class="text">S/N: ${workOrder.serialNumber || '-'}</div>
              </div>
              <div class="priority-box">${workOrder.priority}</div>
            </div>
          </div>
          <script>
            window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 400); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      <div ref={qrRef} style={{ display: 'none' }}>
        <QRCodeSVG 
          value={`${baseUrl.replace(/\/$/, '')}/t/${workOrder.id}`}
          size={256}
          level="H"
          includeMargin={false}
        />
      </div>
      <button onClick={printSticker} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition border border-blue-200">
        <Tag size={18} /> Címke
      </button>
    </>
  );
}
