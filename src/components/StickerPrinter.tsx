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
            @page { margin: 0; size: 60mm 40mm; }
            body { 
              margin: 0; 
              padding: 2mm; 
              font-family: 'Arial', sans-serif; 
              display: flex;
              align-items: center;
              gap: 3mm;
              height: 40mm;
              box-sizing: border-box;
            }
            .qr-container { width: 32mm; height: 32mm; flex-shrink: 0; display: flex; align-items: center; justify-content: center; position: relative; }
            .logo-overlay { position: absolute; width: 8mm; height: 8mm; background: white; padding: 0.5mm; border-radius: 1mm; }
            .info { flex: 1; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
            .id { font-size: 16pt; font-weight: bold; font-family: monospace; border-bottom: 2px solid #000; margin-bottom: 1mm; }
            .text { font-size: 9pt; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .priority { font-size: 8pt; font-weight: bold; text-transform: uppercase; margin-top: 2mm; border: 2px solid #000; padding: 0.5mm 2mm; align-self: flex-start; }
            canvas, svg { width: 100% !important; height: 100% !important; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div id="qr"></div>
            ${logoPath ? `<img src="${logoPath}" class="logo-overlay" />` : ''}
          </div>
          <div class="info">
            <div class="id">${workOrder.id.slice(-6).toUpperCase()}</div>
            <div class="text"><strong>Ügyfél:</strong> ${workOrder.customerName || '-'}</div>
            <div class="text"><strong>Eszköz:</strong> ${workOrder.deviceType || '-'}</div>
            <div class="text"><strong>S/N:</strong> ${workOrder.serialNumber || '-'}</div>
            <div class="priority">${workOrder.priority}</div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode_js@1.0.0/qrcode.min.js"></script>
          <script>
            try {
              new QRCode(document.getElementById("qr"), {
                text: "${qrUrl}",
                width: 256,
                height: 256,
                correctLevel: QRCode.CorrectLevel.H
              });
              setTimeout(() => {
                window.print();
                window.close();
              }, 700);
            } catch (e) { console.error(e); }
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
