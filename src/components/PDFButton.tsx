'use client'

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Printer } from 'lucide-react';
import { archiveWorkOrderPdf, getSettings } from '@/lib/actions';

interface Props {
  workOrder: any;
}

export default function PDFButton({ workOrder }: Props) {
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

    // Create Main Report Container
    const reportContainer = document.createElement('div');
    reportContainer.style.width = '800px';
    reportContainer.style.padding = '40px';
    reportContainer.style.backgroundColor = 'white';
    reportContainer.style.fontFamily = 'Arial, sans-serif';
    reportContainer.style.position = 'absolute';
    reportContainer.style.left = '-9999px';

    reportContainer.innerHTML = `
      <div style="border-bottom: 4px solid #1e40af; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 20px;">
          ${logoUrl ? `<img src="${logoUrl}" style="height: 60px; width: 60px; object-fit: contain;" />` : ''}
          <div>
            <h1 style="font-size: 28px; margin: 0; font-weight: 800; color: #1e40af;">${fixChars('SZERVIZ JEGYZÖKÖNYV')}</h1>
            <p style="margin: 0; font-size: 14px; color: #666; font-weight: bold;">${fixChars(settings.workshopName)}</p>
          </div>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 14px; color: #666;">Munkalap: <strong>${workOrder.id.slice(-6).toUpperCase()}</strong></p>
          <p style="margin: 0; font-size: 14px; color: #666;">Dátum: ${formatDate(new Date())}</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
          <h2 style="font-size: 18px; color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">Ügyfél Adatok</h2>
          <p style="margin: 5px 0;"><strong>Név:</strong> ${fixChars(workOrder.customerName)}</p>
          <p style="margin: 5px 0;"><strong>${fixChars('Elérhetőség')}:</strong> ${fixChars(workOrder.customerContact)}</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
          <h2 style="font-size: 18px; color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">Eszköz Adatok</h2>
          <p style="margin: 5px 0;"><strong>Típus:</strong> ${fixChars(workOrder.deviceType)}</p>
          <p style="margin: 5px 0;"><strong>Sorozatszám:</strong> ${fixChars(workOrder.serialNumber)}</p>
          <p style="margin: 5px 0;"><strong>Státusz:</strong> <span style="color: #1e40af; font-weight: bold;">${fixChars(workOrder.status)}</span></p>
        </div>
      </div>

      <div style="margin-bottom: 30px; background: #fffbeb; border: 1px solid #fef3c7; padding: 20px; border-radius: 8px;">
        <h2 style="font-size: 18px; color: #92400e; border-bottom: 1px solid #fde68a; padding-bottom: 8px; margin-bottom: 10px;">${fixChars('Állapot és Hiba')}</h2>
        <p style="margin: 5px 0;"><strong>${fixChars('Eszköz állapota')}:</strong> ${fixChars(workOrder.condition)}</p>
        <p style="margin: 5px 0;"><strong>Bejelentett hiba:</strong> ${fixChars(workOrder.complaint)}</p>
      </div>

      ${workOrder.statusHistory.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 5px; margin-bottom: 10px;">${fixChars('Státusz Történet')}</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0;">
            <tr style="background: #f1f5f9;">
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">Dátum</th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">Státusz</th>
            </tr>
            ${workOrder.statusHistory.map((log: any) => `
              <tr>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${formatDate(log.createdAt)}</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${fixChars(log.status)}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      ` : ''}

      ${workOrder.photos.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 5px; margin-bottom: 10px;">Csatolt Fotók</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            ${workOrder.photos.map((p: any) => `
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #fff; display: flex; flex-direction: column;">
                <img src="/api/media${p.filePath}" style="width: 100%; max-height: 450px; object-fit: contain; margin-bottom: 12px; border-radius: 4px; display: block;" />
                <p style="font-size: 11px; color: #94a3b8; margin: 0;">${formatDate(p.createdAt)}</p>
                <p style="font-size: 14px; margin: 5px 0 0; color: #1e293b; line-height: 1.4;">${p.description ? fixChars(p.description) : `<i>${fixChars('Nincs leírás')}</i>`}</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${workOrder.notes.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 5px; margin-bottom: 10px;">Munkalap Jegyzetek</h2>
          ${workOrder.notes.map((note: any) => `
            <div style="margin-bottom: 10px; border-left: 4px solid #cbd5e1; padding: 10px 15px; background: #f8fafc;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">${formatDate(note.createdAt)}</p>
              <p style="margin: 5px 0 0; font-size: 15px; color: #334155;">${fixChars(note.text)}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
        <p style="font-size: 14px; font-weight: bold; color: #111; margin: 0;">${fixChars(settings.workshopName)}</p>
        ${settings.technicianName ? `<p style="font-size: 12px; color: #666; margin: 2px 0;">Technikus: ${fixChars(settings.technicianName)}</p>` : ''}
        <p style="font-size: 10px; color: #94a3b8; margin-top: 10px;">${fixChars('Generálva a Szerviz Kezelő alkalmazással')} • ${formatDate(new Date())}</p>
      </div>
    `;

    // Create Declaration Container (Separate Page)
    const declContainer = document.createElement('div');
    declContainer.style.width = '800px';
    declContainer.style.padding = '40px';
    declContainer.style.backgroundColor = 'white';
    declContainer.style.fontFamily = 'Arial, sans-serif';
    declContainer.style.position = 'absolute';
    declContainer.style.left = '-9999px';

    declContainer.innerHTML = `
      <div style="border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 20px;">
          ${logoUrl ? `<img src="${logoUrl}" style="height: 50px; width: 50px; object-fit: contain;" />` : ''}
          <div>
            <h1 style="font-size: 22px; margin: 0; font-weight: 800; color: #111;">NYILATKOZAT</h1>
            <p style="margin: 0; font-size: 12px; color: #666;">${fixChars(settings.workshopName)}</p>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 40px;">
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

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px; padding: 0 40px;">
        <div style="text-align: center; width: 250px;">
          <div style="border-bottom: 1px solid #94a3b8; height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
            <img src="${workOrder.signatureData}" style="max-height: 80px; max-width: 230px; object-fit: contain;" />
          </div>
          <p style="font-size: 12px; color: #64748b; font-weight: bold;">Ügyfél aláírása</p>
          <p style="font-size: 10px; color: #94a3b8; margin: 2px 0;">Digitálisan rögzítve: ${formatDate(workOrder.signedAt)}</p>
        </div>

        <div style="text-align: center; width: 250px;">
          <div style="border-bottom: 1px solid #94a3b8; height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
             ${settings.representativeSignature ? `<img src="${settings.representativeSignature}" style="max-height: 80px; max-width: 230px; object-fit: contain;" />` : `<p style="font-size: 16px; font-weight: bold; color: #1e40af;">${fixChars(settings.workshopName)}</p>`}
          </div>
          <p style="font-size: 12px; color: #64748b; font-weight: bold;">${fixChars(settings.workshopName)} képviseletében</p>
        </div>
      </div>
    `;

    document.body.appendChild(reportContainer);
    if (workOrder.signatureData) document.body.appendChild(declContainer);

    const images = Array.from(document.querySelectorAll('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
    }));

    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Pass 1: Main Report
    const canvasReport = await html2canvas(reportContainer, { scale: 1.5, useCORS: true, logging: false, backgroundColor: '#ffffff' });
    const imgDataReport = canvasReport.toDataURL('image/jpeg', 0.85);
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeightReport = (canvasReport.height * imgWidth) / canvasReport.width;
    
    let heightLeft = imgHeightReport;
    let position = 0;

    pdf.addImage(imgDataReport, 'JPEG', 0, position, imgWidth, imgHeightReport);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeightReport;
      pdf.addPage();
      pdf.addImage(imgDataReport, 'JPEG', 0, position, imgWidth, imgHeightReport);
      heightLeft -= pageHeight;
    }

    // Pass 2: Declaration (New Page)
    if (workOrder.signatureData) {
      const canvasDecl = await html2canvas(declContainer, { scale: 1.5, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const imgDataDecl = canvasDecl.toDataURL('image/jpeg', 0.85);
      const imgHeightDecl = (canvasDecl.height * imgWidth) / canvasDecl.width;
      
      pdf.addPage();
      pdf.addImage(imgDataDecl, 'JPEG', 0, 0, imgWidth, imgHeightDecl);
    }

    pdf.save(`munkalap-${workOrder.id.slice(-6).toUpperCase()}.pdf`);
    
    if (workOrder.status === 'Kiadva') {
      const formData = new FormData();
      formData.append('workOrderId', workOrder.id);
      formData.append('pdfData', pdf.output('datauristring'));
      await archiveWorkOrderPdf(formData);
    }

    document.body.removeChild(reportContainer);
    if (workOrder.signatureData) document.body.removeChild(declContainer);
  };

  return (
    <button
      onClick={generatePDF}
      className="flex items-center gap-2 bg-gray-800 text-white px-6 py-4 rounded-xl shadow-lg font-bold hover:bg-black transition w-full justify-center text-lg"
    >
      <Printer size={22} /> Jegyzőkönyv (PDF)
    </button>
  );
}
