import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CheckCircle2, Clock, Smartphone, User, ShieldCheck, Calendar, MapPin } from 'lucide-react';

export default async function CustomerStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Try finding by full ID first, then by short ID (last 6 chars)
  let wo = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
      lineItems: true,
    },
  });

  if (!wo) {
    // If not found, try searching for a work order whose ID ends with the provided short ID
    // We use findFirst because IDs are unique, but short IDs could theoretically collide (highly unlikely with 6 chars of CUID)
    wo = await prisma.workOrder.findFirst({
      where: {
        id: { endsWith: id }
      },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        lineItems: true,
      },
    });
  }

  if (!wo) {
    notFound();
  }

  const settings = await prisma.settings.findFirst();

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header / Branding */}
        <header className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
               <ShieldCheck className="text-white" size={24} />
             </div>
             <div className="text-left">
               <h1 className="text-xl font-black text-gray-900 tracking-tight">{settings?.workshopName || 'Szerviz Központ'}</h1>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ügyfél Portál</p>
             </div>
          </div>
        </header>

        {/* Status Card */}
        <section className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-500/5 border border-gray-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8">
            <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${
              wo.status === 'Kész / Átvehető' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : 'bg-blue-50 text-blue-700 border-blue-100'
            }`}>
              {wo.status}
            </div>
          </div>

          <div className="p-8 sm:p-12 space-y-10">
            <div className="space-y-2">
              <p className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Munkalap állapota</p>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">
                {wo.status === 'Kész / Átvehető' ? 'A készülék elkészült!' : 
                 wo.status === 'Kiadva' ? 'A készülék átvéve' :
                 wo.status === 'Javíthatatlan' ? 'A készülék nem javítható' :
                 'Javítás folyamatban...'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="bg-gray-50 p-3 rounded-2xl text-gray-400">
                  <Smartphone size={24} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Készülék</p>
                  <p className="text-lg font-bold text-gray-900">{wo.deviceType}</p>
                  <p className="text-xs font-mono text-gray-400 mt-1">S/N: {wo.serialNumber || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-gray-50 p-3 rounded-2xl text-gray-400">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Ügyfél</p>
                  <p className="text-lg font-bold text-gray-900">{wo.customerName}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6 pt-6 border-t border-gray-50">
               <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                 <Clock size={16} className="text-blue-500" /> Eseménytörténet
               </h3>
               
               <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                 {wo.statusHistory.map((log, index) => (
                   <div key={log.id} className="relative pl-9">
                     <div className={`absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                       index === 0 ? 'bg-blue-600 scale-110' : 'bg-gray-200'
                     }`}>
                       {index === 0 && <CheckCircle2 className="text-white" size={12} strokeWidth={4} />}
                     </div>
                     <div>
                       <p className={`font-bold ${index === 0 ? 'text-gray-900' : 'text-gray-500'}`}>{log.status}</p>
                       <p className="text-xs text-gray-400 font-medium">{log.createdAt.toLocaleString('hu-HU')}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="bg-gray-50/50 p-8 sm:p-10 border-t border-gray-100">
             <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3 text-gray-500">
                  <Calendar size={18} />
                  <span className="text-sm font-bold">Felvéve: {wo.createdAt.toLocaleDateString('hu-HU')}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <MapPin size={18} />
                  <span className="text-sm font-bold">{settings?.workshopName || 'Személyes átvétel'}</span>
                </div>
             </div>
          </div>
        </section>

        <footer className="text-center pb-8">
           <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">© 2026 {settings?.workshopName} • Biztonságos állapotkövetés</p>
        </footer>
      </div>
    </div>
  );
}
