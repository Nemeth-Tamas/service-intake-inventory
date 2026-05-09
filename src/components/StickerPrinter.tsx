'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Tag } from 'lucide-react';
import { useRef } from 'react';

interface Props {
  workOrder: any;
  baseUrl: string;
  logoPath?: string | null;
}

export default function StickerPrinter({ workOrder, baseUrl, logoPath }: Props) {
  const qrRef = useRef<HTMLDivElement>(null);

  const printSticker = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const qrUrl = `${cleanBaseUrl}/t/${workOrder.id}`;
    
    // We get the rendered SVG from our hidden container
    const qrSvg = qrRef.current?.innerHTML || '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Címke: ${workOrder.id.slice(-6).toUpperCase()}</title>
          <style>
            @page { 
              margin: 0; 
              size: 60mm 40mm; 
            }
            * { 
              box-sizing: border-box; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
            }
            html, body { 
              margin: 0; 
              padding: 0;
              width: 60mm;
              height: 40mm;
              background: white;
              overflow: hidden;
            }
            .sticker-container {
              width: 60mm;
              height: 40mm;
              padding: 4mm;
              display: flex;
              align-items: center;
              font-family: 'Arial', sans-serif;
            }
            .qr-side { 
              width: 32mm; 
              height: 32mm; 
              flex-shrink: 0; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              position: relative;
            }
            .qr-side svg {
              width: 100% !important;
              height: 100% !important;
            }
            .logo-overlay { 
              position: absolute; 
              width: 8mm; 
              height: 8mm; 
              background: white; 
              padding: 0.5mm; 
              border-radius: 1.5mm;
              z-index: 10;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              border: 0.5mm solid #fff;
            }
            .info-side { 
              flex: 1; 
              height: 32mm;
              display: flex; 
              flex-direction: column; 
              padding-left: 4mm;
              overflow: hidden; 
              justify-content: space-between;
            }
            .id-header { 
              border-bottom: 2px solid #000; 
              padding-bottom: 1mm;
              margin-bottom: 2mm;
            }
            .id-text { font-size: 16pt; font-weight: 900; font-family: monospace; }
            .details { flex-grow: 1; display: flex; flex-direction: column; gap: 1mm; }
            .text { font-size: 8pt; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #000; font-weight: bold; }
            .priority-box { 
              font-size: 9pt; 
              font-weight: 900; 
              text-transform: uppercase; 
              border: 2px solid #000; 
              padding: 1mm 2mm; 
              align-self: flex-start;
              background: #000 !important;
              color: #fff !important;
            }
          </style>
        </head>
        <body>
          <div class="sticker-container">
            <div class="qr-side">
              ${qrSvg}
              ${logoPath ? `<img src="${logoPath}" class="logo-overlay" />` : ''}
            </div>
            <div class="info-side">
              <div class="id-header">
                <div class="id-text">${workOrder.id.slice(-6).toUpperCase()}</div>
              </div>
              <div class="details">
                <div class="text">ÜGYFÉL: ${workOrder.customerName || '-'}</div>
                <div class="text">TÍPUS: ${workOrder.deviceType || '-'}</div>
                <div class="text">S/N: ${workOrder.serialNumber || '-'}</div>
              </div>
              <div class="priority-box">${workOrder.priority}</div>
            </div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      {/* Hidden container to pre-render the QR SVG correctly */}
      <div ref={qrRef} style={{ display: 'none' }}>
        <QRCodeSVG 
          value={`${baseUrl.replace(/\/$/, '')}/t/${workOrder.id}`}
          size={256}
          level="H"
          includeMargin={false}
        />
      </div>

      <button
        onClick={printSticker}
        className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition border border-blue-200"
        title="Eszköz Címke Nyomtatása"
      >
        <Tag size={18} /> Címke Nyomtatás
      </button>
    </>
  );
}
