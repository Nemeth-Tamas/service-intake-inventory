import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import PhotoUpload from '@/components/PhotoUpload';
import PDFButton from '@/components/PDFButton';
import { addNote } from '@/lib/actions';
import { MessageSquare, Tag, User, Info, Clock, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default async function TrackingPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: { 
      notes: { orderBy: { createdAt: 'desc' } }, 
      photos: { orderBy: { createdAt: 'desc' } } 
    },
  });

  if (!workOrder) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-20">
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold text-gray-800">Munkalap: {workOrder.id.slice(-6).toUpperCase()}</h1>
        <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold shadow-sm">
          {workOrder.status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <section className="bg-white border p-4 rounded-xl shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold mb-3 text-gray-700 border-b pb-2">
              <User size={18} /> Ügyfél Adatok
            </h2>
            <div className="space-y-1">
              <p><span className="text-gray-400 text-sm uppercase">Név:</span> <br/>{workOrder.customerName || 'Nincs megadva'}</p>
              <p><span className="text-gray-400 text-sm uppercase">Kapcsolat:</span> <br/>{workOrder.customerContact || 'Nincs megadva'}</p>
            </div>
          </section>

          <section className="bg-white border p-4 rounded-xl shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold mb-3 text-gray-700 border-b pb-2">
              <Tag size={18} /> Eszköz Infó
            </h2>
            <div className="space-y-1">
              <p><span className="text-gray-400 text-sm uppercase">Típus:</span> <br/>{workOrder.deviceType || 'Nincs megadva'}</p>
              <p><span className="text-gray-400 text-sm uppercase">S/N:</span> <br/>{workOrder.serialNumber || 'Nincs megadva'}</p>
              <p className="mt-2 text-sm italic text-gray-600 bg-gray-50 p-2 rounded">
                <span className="font-semibold block not-italic">Állapot:</span>
                {workOrder.condition || '-'}
              </p>
            </div>
          </section>
        </div>

        <div className="bg-white border p-4 rounded-xl shadow-sm flex flex-col items-center justify-center space-y-4">
          <QRCodeDisplay value={`/t/${workOrder.id}`} />
          <p className="text-xs text-gray-400 text-center">A QR kód beolvasásával bárki <br/> elérheti ezt az adatlapot.</p>
        </div>
      </div>

      <section className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold mb-2 text-amber-800">
          <Info size={18} /> Hiba Leírása
        </h2>
        <p className="whitespace-pre-wrap text-amber-900">{workOrder.complaint || 'Nincs megadva'}</p>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="flex items-center gap-2 font-semibold text-lg text-gray-800">
            <ImageIcon size={20} /> Fotók
          </h2>
          <PhotoUpload workOrderId={workOrder.id} />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {workOrder.photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border shadow-sm">
              <Image 
                src={photo.filePath} 
                alt="Device photo" 
                fill 
                className="object-cover"
              />
            </div>
          ))}
          {workOrder.photos.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-400 border-2 border-dashed rounded-lg">
              Még nincsenek fotók.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-semibold text-lg text-gray-800">
          <MessageSquare size={20} /> Jegyzetek
        </h2>
        
        <form action={addNote} className="flex gap-2">
          <input type="hidden" name="workOrderId" value={workOrder.id} />
          <input
            name="text"
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Új jegyzet..."
            required
          />
          <button type="submit" className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition shadow-md">
            +
          </button>
        </form>

        <div className="space-y-3">
          {workOrder.notes.map((note) => (
            <div key={note.id} className="bg-white border p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-400 flex items-center gap-1 mb-1 border-b pb-1">
                <Clock size={12} /> {note.createdAt.toLocaleString('hu-HU')}
              </p>
              <p className="whitespace-pre-wrap text-gray-700 text-sm">{note.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 sm:static sm:translate-x-0 sm:max-w-none sm:px-0 sm:flex sm:justify-end">
        <PDFButton workOrder={workOrder} />
      </div>
    </div>
  );
}
