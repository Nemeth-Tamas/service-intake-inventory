import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import PhotoUpload from '@/components/PhotoUpload';
import PDFButton from '@/components/PDFButton';
import StatusSelector from '@/components/StatusSelector';
import PrioritySelector from '@/components/PrioritySelector';
import PhotoGallery from '@/components/PhotoGallery';
import StickerPrinter from '@/components/StickerPrinter';
import DeleteWorkOrder from '@/components/DeleteWorkOrder';
import DeviceHistory from '@/components/DeviceHistory';
import { addNote, getSettings } from '@/lib/actions';
import { MessageSquare, Tag, User, Info, Clock, Image as ImageIcon, Download, ArrowLeft, Calendar, AlertTriangle, FileText } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TrackingPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const settings = await getSettings();
  
  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: { 
      notes: { orderBy: { createdAt: 'desc' } }, 
      photos: { orderBy: { createdAt: 'desc' } },
      statusHistory: { orderBy: { createdAt: 'desc' } }
    },
  });

  if (!workOrder) {
    notFound();
  }

  const cleanBaseUrl = settings.baseUrl.replace(/\/$/, '');
  const absoluteUrl = `${cleanBaseUrl}/t/${workOrder.id}`;

  const isPurged = workOrder.status === 'Kiadva' && workOrder.photos.length === 0 && workOrder.archivedPdfPath;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-700 transition font-medium"
        >
          <ArrowLeft size={20} />
          <span>Vissza</span>
        </Link>
        <div className="flex items-center gap-3">
          <StickerPrinter workOrder={workOrder} baseUrl={settings.baseUrl} logoPath={settings.logoPath} />
          <DeleteWorkOrder workOrderId={workOrder.id} />
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              Munkalap: <span className="font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase">{workOrder.id.slice(-6)}</span>
            </h1>
            <div className="flex flex-wrap gap-3 items-center">
              <PrioritySelector workOrderId={workOrder.id} currentPriority={workOrder.priority} />
              {workOrder.estimatedDone && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-amber-50 text-amber-700 border-amber-200">
                  <Calendar size={14} /> Határidő: {workOrder.estimatedDone.toLocaleDateString('hu-HU')}
                </span>
              )}
            </div>
          </div>
          <div className="w-full md:w-auto">
            <StatusSelector workOrderId={workOrder.id} currentStatus={workOrder.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white border p-6 rounded-2xl shadow-sm">
              <h2 className="flex items-center gap-2 font-bold mb-4 text-gray-800 border-b pb-3 text-lg">
                <User size={20} className="text-blue-500" /> Ügyfél Adatok
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Név</p>
                  <p className="text-gray-900 font-semibold text-lg">{workOrder.customerName || 'Nincs megadva'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Kapcsolat</p>
                  <p className="text-gray-900 font-medium">{workOrder.customerContact || 'Nincs megadva'}</p>
                </div>
              </div>
            </section>

            <section className="bg-white border p-6 rounded-2xl shadow-sm">
              <h2 className="flex items-center gap-2 font-bold mb-4 text-gray-800 border-b pb-3 text-lg">
                <Tag size={20} className="text-blue-500" /> Eszköz Infó
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Típus</p>
                    <p className="text-gray-900 font-semibold">{workOrder.deviceType || 'Ismeretlen'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">S/N</p>
                    <p className="text-gray-900 font-mono font-bold text-sm bg-gray-50 px-2 py-0.5 rounded">{workOrder.serialNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Állapot</p>
                  <p className="text-gray-700 text-sm leading-relaxed italic">{workOrder.condition || 'Nincs leírás'}</p>
                </div>
              </div>
            </section>
          </div>

          <section className="bg-amber-50 p-6 rounded-2xl border border-amber-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Info size={80} className="text-amber-900" />
            </div>
            <h2 className="flex items-center gap-2 font-bold mb-3 text-amber-900 text-lg relative z-10">
              <Info size={22} /> Hiba Leírása
            </h2>
            <p className="whitespace-pre-wrap text-amber-950 font-medium leading-relaxed relative z-10">{workOrder.complaint || 'Nincs hiba leírás'}</p>
          </section>

          <Suspense fallback={<div className="h-40 bg-gray-100 animate-pulse rounded-2xl" />}>
            <DeviceHistory serialNumber={workOrder.serialNumber || '-'} currentId={workOrder.id} />
          </Suspense>

          <section className="bg-white border p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="flex items-center gap-2 font-bold text-xl text-gray-800">
                <ImageIcon size={24} className="text-blue-500" /> Fotó Dokumentáció
              </h2>
              <PhotoUpload workOrderId={workOrder.id} />
            </div>
            
            {isPurged ? (
              <div className="bg-blue-50 border border-blue-200 p-8 rounded-2xl text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <FileText size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-blue-900 text-lg">Archivált Munkalap</h3>
                  <p className="text-blue-700 text-sm max-w-md mx-auto">
                    A fotók 30 nap után törlésre kerültek a tárhely felszabadítása érdekében. A teljes fotódokumentációt megtalálod a végleges PDF jegyzőkönyvben.
                  </p>
                </div>
                <a 
                  href={workOrder.archivedPdfPath!} 
                  target="_blank"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
                >
                  <Download size={20} /> Archivált PDF Megnyitása
                </a>
              </div>
            ) : (
              <PhotoGallery photos={workOrder.photos} workOrderId={workOrder.id} />
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <div className="bg-white border p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center space-y-4">
            <QRCodeDisplay value={absoluteUrl} />
            <p className="text-[11px] text-gray-400 text-center leading-tight">Beolvasás az adatlaphoz<br/>bármely belső hálózati eszközről.</p>
          </div>

          <section className="bg-white border p-6 rounded-2xl shadow-sm space-y-6">
            <h2 className="flex items-center gap-2 font-bold text-xl text-gray-800 border-b pb-4">
              <MessageSquare size={24} className="text-blue-500" /> Jegyzetek
            </h2>
            
            <form action={addNote} className="flex gap-2">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <input
                name="text"
                className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Új bejegyzés..."
                required
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow-md">
                +
              </button>
            </form>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {workOrder.notes.map((note) => (
                <div key={note.id} className="bg-gray-50 border border-gray-100 p-4 rounded-xl shadow-sm">
                  <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mb-2 uppercase tracking-widest border-b border-gray-100 pb-1">
                    <Clock size={12} /> {note.createdAt.toLocaleString('hu-HU')}
                  </p>
                  <p className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">{note.text}</p>
                </div>
              ))}
              {workOrder.notes.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4 italic">Nincsenek jegyzetek.</p>
              )}
            </div>
          </section>
        </aside>
      </div>

      <div className="fixed bottom-6 right-6 sm:static sm:translate-x-0 sm:flex sm:justify-end mt-8">
        <div className="w-full max-w-xs">
          <PDFButton workOrder={workOrder} />
        </div>
      </div>
    </div>
  );
}
