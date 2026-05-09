'use client'

import { jsPDF } from 'jspdf';
import { Printer } from 'lucide-react';

interface Props {
  workOrder: any;
}

export default function PDFButton({ workOrder }: Props) {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text('SZERVIZ JEGYZŐKÖNYV', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Azonosító: ${workOrder.id}`, 20, 35);
    doc.text(`Dátum: ${new Date().toLocaleDateString('hu-HU')}`, 20, 42);
    doc.text(`Státusz: ${workOrder.status}`, 20, 49);

    // Customer
    doc.setFontSize(14);
    doc.text('ÜGYFÉL ADATOK', 20, 65);
    doc.line(20, 67, 190, 67);
    doc.setFontSize(11);
    doc.text(`Név: ${workOrder.customerName || '-'}`, 25, 75);
    doc.text(`Elérhetőség: ${workOrder.customerContact || '-'}`, 25, 82);

    // Device
    doc.setFontSize(14);
    doc.text('ESZKÖZ ADATOK', 20, 95);
    doc.line(20, 97, 190, 97);
    doc.setFontSize(11);
    doc.text(`Típus: ${workOrder.deviceType || '-'}`, 25, 105);
    doc.text(`Sorozatszám: ${workOrder.serialNumber || '-'}`, 25, 112);
    doc.text(`Állapot:`, 25, 119);
    doc.setFontSize(10);
    const conditionLines = doc.splitTextToSize(workOrder.condition || '-', 160);
    doc.text(conditionLines, 30, 125);

    // Complaint
    doc.setFontSize(14);
    doc.text('HIBA LEÍRÁSA', 20, 150);
    doc.line(20, 152, 190, 152);
    doc.setFontSize(10);
    const complaintLines = doc.splitTextToSize(workOrder.complaint || '-', 160);
    doc.text(complaintLines, 25, 160);

    // Notes
    if (workOrder.notes.length > 0) {
      doc.setFontSize(14);
      doc.text('JEGYZETEK', 20, 190);
      doc.line(20, 192, 190, 192);
      let y = 200;
      workOrder.notes.forEach((note: any) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(9);
        doc.text(new Date(note.createdAt).toLocaleString('hu-HU'), 25, y);
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(note.text, 160);
        doc.text(lines, 30, y + 5);
        y += (lines.length * 5) + 10;
      });
    }

    doc.save(`szerviz-${workOrder.id.slice(-6)}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg font-bold hover:bg-black transition"
    >
      <Printer size={20} /> Jegyzőkönyv (PDF)
    </button>
  );
}
