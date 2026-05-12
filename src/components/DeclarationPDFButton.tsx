'use client'

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';
import { getSettings } from '@/lib/actions';

interface Props {
  workOrder: any;
}

export default function DeclarationPDFButton({ workOrder }: Props) {
  const generatePDF = async () => {
    const settings = await getSettings();
    const logoUrl = settings.logoPath ? `/api/media${settings.logoPath}` : null;

    const fixChars = (str: string | null | undefined) => {
      if (!str) return '-';
      return str
        .replace(/Ő/g, 'Ö')
        .replace(/ő/g, 'ö')
        .replace(/Ű/g, 'Ü')
        .replace(/ű/g, 'ü');
    };

    const formatDate = (date: Date | string) => new Date(date).toLocaleString('hu-HU');

    // Create a container
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.padding = '60px';
    container.style.backgroundColor = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.position = 'absolute';
    container.style.left = '-9999px';

    container.innerHTML = `
      <div style="border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 20px;">
          ${logoUrl ? `<img src="${logoUrl}" style="height: 50px; width: 50px; object-fit: contain;" />` : ''}
          <div>
            <h1 style="font-size: 22px; margin: 0; font-weight: 800; color: #111;">NYILATKOZAT</h1>
            <p style="margin: 0; font-size: 12px; color: #666;">${fixChars(settings.workshopName)}</p>
          </div>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 12px; color: #666;">Munkalap: <strong>${workOrder.id.slice(-6).toUpperCase()}</strong></p>
          <p style="margin: 0; font-size: 12px; color: #666;">Dátum: ${formatDate(workOrder.signedAt || new Date())}</p>
        </div>
      </div>

      <div style="margin-bottom: 40px; padding: 20px; border: 1px solid #f1f5f9; border-radius: 8px; background: #f8fafc;">
        <h2 style="font-size: 16px; color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px;">Ügyfél és Eszköz Adatok</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Név:</strong> ${fixChars(workOrder.customerName)}</p>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Elérhetőség:</strong> ${fixChars(workOrder.customerContact)}</p>
          </div>
          <div>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Eszköz:</strong> ${fixChars(workOrder.deviceType)}</p>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Sorozatszám:</strong> ${fixChars(workOrder.serialNumber)}</p>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 60px;">
        <h2 style="font-size: 16px; color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 5px; margin-bottom: 20px;">NYILATKOZAT SZÖVEGE</h2>
        <div class="declaration-content" style="font-size: 13px; line-height: 1.6; color: #334155; padding: 20px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <style>
            .declaration-content p { margin-bottom: 0.5rem !important; line-height: 1.5; min-height: 1em; }
            .declaration-content p:empty::before { content: "\\00a0"; }
            .declaration-content ul { list-style-type: disc !important; padding-left: 1.25rem !important; margin-top: 0.25rem !important; margin-bottom: 0.75rem !important; }
            .declaration-content li { margin-bottom: 0.25rem !important; padding-left: 0.25rem; display: list-item !important; }
          </style>
          ${fixChars(workOrder.signedDeclarationText || settings.declarationTemplate).replace(/&nbsp;/g, ' ')}
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding: 0 40px;">
        <div style="text-align: center; width: 250px;">
          <div style="border-bottom: 1px solid #94a3b8; height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
            ${workOrder.signatureData ? `<img src="${workOrder.signatureData}" style="max-height: 80px; max-width: 230px; object-fit: contain;" />` : `<span style="color: #cbd5e1; font-size: 12px;">Nincs aláírás</span>`}
          </div>
          <p style="font-size: 12px; color: #64748b; font-weight: bold;">Ügyfél aláírása</p>
          <p style="font-size: 10px; color: #94a3b8; margin: 2px 0;">Digitálisan rögzítve: ${formatDate(workOrder.signedAt || new Date())}</p>
        </div>

        <div style="text-align: center; width: 250px;">
          <div style="border-bottom: 1px solid #94a3b8; height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
             ${settings.representativeSignature ? `<img src="${settings.representativeSignature}" style="max-height: 80px; max-width: 230px; object-fit: contain;" />` : `<p style="font-size: 16px; font-weight: bold; color: #1e40af;">${fixChars(settings.workshopName)}</p>`}
          </div>
          <p style="font-size: 12px; color: #64748b; font-weight: bold;">${fixChars(settings.workshopName)} képviseletében</p>
        </div>
      </div>

      <div style="margin-top: 80px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
        <p style="font-size: 10px; color: #94a3b8;">
          Ez a dokumentum a(z) ${fixChars(settings.workshopName)} szervizkezelő rendszerével készült. 
          A digitális aláírás a felek által elfogadott, jogilag kötőerejű nyilatkozatnak minősül.
        </p>
      </div>
    `;

    document.body.appendChild(container);

    const images = Array.from(container.getElementsByTagName('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
    }));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    pdf.save(`nyilatkozat-${workOrder.id.slice(-6).toUpperCase()}.pdf`);
    
    document.body.removeChild(container);
  };

  return (
    <button
      onClick={generatePDF}
      className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition shadow-sm font-bold text-sm w-full justify-center"
    >
      <Download size={16} /> Nyilatkozat Letöltése
    </button>
  );
}
