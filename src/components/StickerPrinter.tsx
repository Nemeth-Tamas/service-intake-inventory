'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Tag } from 'lucide-react';

interface Props {
  workOrder: any;
  baseUrl: string;
  logoPath?: string | null;
}

export default function StickerPrinter({ workOrder, baseUrl, logoPath }: Props) {
  const printSticker = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const qrUrl = `${cleanBaseUrl}/t/${workOrder.id}`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Címke Nyomtatás</title>
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
            }
            .sticker-wrapper {
              width: 60mm;
              height: 40mm;
              padding: 3mm;
              display: flex;
              align-items: center;
              justify-content: flex-start;
              font-family: 'Arial', sans-serif;
            }
            .qr-side { 
              width: 30mm; 
              height: 30mm; 
              flex-shrink: 0; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              position: relative;
            }
            .logo-overlay { 
              position: absolute; 
              width: 7mm; 
              height: 7mm; 
              background: white; 
              padding: 0.5mm; 
              border-radius: 1mm;
              z-index: 10;
            }
            .info-side { 
              flex: 1; 
              height: 30mm;
              display: flex; 
              flex-direction: column; 
              padding-left: 3mm;
              overflow: hidden; 
            }
            .id-box { 
              border-bottom: 2px solid #000; 
              margin-bottom: 1.5mm;
              padding-bottom: 0.5mm;
            }
            .id-text { font-size: 14pt; font-weight: 900; font-family: monospace; }
            .details { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; gap: 0.8mm; }
            .text { font-size: 7.5pt; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #000; font-weight: 700; }
            .priority-badge { 
              font-size: 8pt; 
              font-weight: 900; 
              text-transform: uppercase; 
              border: 1.5pt solid #000; 
              padding: 0.5mm 2mm; 
              align-self: flex-start;
              background: #000 !important;
              color: #fff !important;
              margin-top: 1.5mm;
            }
            /* Robust QR sizing */
            #qr-canvas { width: 30mm !important; height: 30mm !important; display: block; }
          </style>
        </head>
        <body>
          <div class="sticker-wrapper">
            <div class="qr-side">
              <canvas id="qr-canvas"></canvas>
              ${logoPath ? `<img src="${logoPath}" class="logo-overlay" />` : ''}
            </div>
            <div class="info-side">
              <div class="id-box">
                <div class="id-text">${workOrder.id.slice(-6).toUpperCase()}</div>
              </div>
              <div class="details">
                <div class="text">ÜGYFÉL: ${workOrder.customerName || '-'}</div>
                <div class="text">TÍPUS: ${workOrder.deviceType || '-'}</div>
                <div class="text">S/N: ${workOrder.serialNumber || '-'}</div>
              </div>
              <div class="priority-badge">${workOrder.priority}</div>
            </div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode_js@1.0.0/qrcode.min.js"></script>
          <script>
            function startPrint() {
              try {
                const canvas = document.getElementById("qr-canvas");
                // Use a high-density QR for better scanning
                new QRCode(canvas, {
                  text: "${qrUrl}",
                  width: 200,
                  height: 200,
                  correctLevel: QRCode.CorrectLevel.H
                });
                
                // Absolute safety delay for the print system
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              } catch (e) { 
                console.error(e);
              }
            }
            window.onload = startPrint;
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <button
      onClick={printSticker}
      className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition border border-blue-200"
      title="Eszköz Címke Nyomtatása"
    >
      <Tag size={18} /> Címke Nyomtatás
    </button>
  );
}
