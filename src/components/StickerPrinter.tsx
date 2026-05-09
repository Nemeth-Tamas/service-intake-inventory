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
            * { box-sizing: border-box; }
            body { 
              margin: 0; 
              padding: 2mm; 
              font-family: 'Arial', sans-serif; 
              display: flex;
              align-items: center;
              justify-content: flex-start;
              width: 60mm;
              height: 40mm;
              overflow: hidden;
            }
            .qr-container { 
              width: 32mm; 
              height: 32mm; 
              flex-shrink: 0; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              position: relative;
              background: white;
              border: 1px solid #eee;
            }
            .logo-overlay { 
              position: absolute; 
              width: 8mm; 
              height: 8mm; 
              background: white; 
              padding: 0.5mm; 
              border-radius: 1mm;
              z-index: 10;
            }
            .info { 
              flex: 1; 
              height: 32mm;
              display: flex; 
              flex-direction: column; 
              justify-content: space-between; 
              padding-left: 2mm;
              overflow: hidden; 
            }
            .header-info { border-bottom: 2px solid #000; padding-bottom: 1mm; }
            .id { font-size: 16pt; font-weight: bold; font-family: monospace; }
            .details { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; gap: 0.5mm; }
            .text { font-size: 8pt; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #333; }
            .priority { 
              font-size: 8pt; 
              font-weight: bold; 
              text-transform: uppercase; 
              border: 2px solid #000; 
              padding: 0.5mm 2mm; 
              align-self: flex-start;
              background: #000;
              color: #fff;
              margin-top: 1mm;
            }
            canvas, svg { width: 100% !important; height: 100% !important; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div id="qr" style="width: 100%; height: 100%;"></div>
            ${logoPath ? `<img src="${logoPath}" class="logo-overlay" />` : ''}
          </div>
          <div class="info">
            <div class="header-info">
              <div class="id">${workOrder.id.slice(-6).toUpperCase()}</div>
            </div>
            <div class="details">
              <div class="text"><strong>Ügyfél:</strong> ${workOrder.customerName || '-'}</div>
              <div class="text"><strong>Eszköz:</strong> ${workOrder.deviceType || '-'}</div>
              <div class="text"><strong>S/N:</strong> ${workOrder.serialNumber || '-'}</div>
            </div>
            <div class="priority">${workOrder.priority}</div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode_js@1.0.0/qrcode.min.js"></script>
          <script>
            try {
              new QRCode(document.getElementById("qr"), {
                text: "${qrUrl}",
                width: 256,
                height: 256,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
              });
              // Ensure everything is rendered
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              };
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
