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
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
            body { 
              margin: 0; 
              padding: 0;
              width: 60mm;
              height: 40mm;
              display: flex;
              align-items: center;
              background: white;
              overflow: hidden;
            }
            .sticker-content {
              display: flex;
              width: 100%;
              height: 100%;
              padding: 2mm;
              align-items: center;
            }
            .qr-side { 
              width: 32mm; 
              height: 32mm; 
              flex-shrink: 0; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              position: relative;
              background: white;
            }
            .logo-overlay { 
              position: absolute; 
              width: 8mm; 
              height: 8mm; 
              background: white; 
              padding: 0.5mm; 
              border-radius: 1mm;
              z-index: 10;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
            }
            .info-side { 
              flex: 1; 
              height: 32mm;
              display: flex; 
              flex-direction: column; 
              padding-left: 2mm;
              overflow: hidden; 
              font-family: 'Arial', sans-serif;
            }
            .id-box { 
              border-bottom: 2px solid #000; 
              margin-bottom: 1mm;
              padding-bottom: 0.5mm;
            }
            .id-text { font-size: 14pt; font-weight: 900; font-family: monospace; }
            .details { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; gap: 0.5mm; }
            .text { font-size: 7.5pt; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #000; font-weight: bold; }
            .priority-badge { 
              font-size: 8pt; 
              font-weight: 900; 
              text-transform: uppercase; 
              border: 1.5pt solid #000; 
              padding: 0.5mm 2mm; 
              align-self: flex-start;
              background: #000;
              color: #fff;
              margin-top: 1mm;
            }
            #qr svg, #qr canvas { width: 100% !important; height: 100% !important; display: block; }
          </style>
        </head>
        <body>
          <div class="sticker-content">
            <div class="qr-side">
              <div id="qr" style="width: 32mm; height: 32mm;"></div>
              ${logoPath ? `<img src="${logoPath}" class="logo-overlay" />` : ''}
            </div>
            <div class="info-side">
              <div class="id-box">
                <div class="id-text">${workOrder.id.slice(-6).toUpperCase()}</div>
              </div>
              <div class="details">
                <div class="text">Ügyfél: ${workOrder.customerName || '-'}</div>
                <div class="text">Típus: ${workOrder.deviceType || '-'}</div>
                <div class="text">S/N: ${workOrder.serialNumber || '-'}</div>
              </div>
              <div class="priority-badge">${workOrder.priority}</div>
            </div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode_js@1.0.0/qrcode.min.js"></script>
          <script>
            function doPrint() {
              try {
                const qrContainer = document.getElementById("qr");
                new QRCode(qrContainer, {
                  text: "${qrUrl}",
                  width: 256,
                  height: 256,
                  colorDark : "#000000",
                  colorLight : "#ffffff",
                  correctLevel: QRCode.CorrectLevel.H
                });
                
                // Wait for image rendering
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 400);
              } catch (e) { 
                console.error(e);
                alert("QR Error: " + e.message);
              }
            }
            
            // Trigger as soon as scripts and possible logo are ready
            window.onload = doPrint;
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
