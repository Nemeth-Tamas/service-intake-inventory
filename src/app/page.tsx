import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, ListChecks, ArrowRight, Settings as SettingsIcon, AlertCircle, Clock } from 'lucide-react';
import DashboardFilters from '@/components/DashboardFilters';
import DashboardStats from '@/components/DashboardStats';
import { Suspense } from 'react';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const where: any = {};
  if (status && status !== 'Összes') where.status = status;
  if (q) {
    where.OR = [
      { customerName: { contains: q } },
      { customerContact: { contains: q } },
      { deviceType: { contains: q } },
      { serialNumber: { contains: q } },
      { condition: { contains: q } },
      { complaint: { contains: q } },
      { id: { contains: q } },
    ];
  }

  const workOrders = await prisma.workOrder.findMany({
    where,
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  const priorityColors: Record<string, string> = {
    'Sürgős': 'text-red-600 bg-red-50 border-red-100',
    'Magas': 'text-orange-600 bg-orange-50 border-orange-100',
    'Normál': 'text-blue-600 bg-blue-50 border-blue-100',
    'Alacsony': 'text-gray-600 bg-gray-50 border-gray-100',
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Szerviz Kezelő</h1>
            <p className="text-gray-500">Beszállítások és nyilvántartás</p>
          </div>
          <Link href="/settings" className="p-2 text-gray-400 hover:text-blue-600 transition">
            <SettingsIcon size={24} />
          </Link>
        </div>
        <Link 
          href="/new" 
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          <Plus size={20} /> Új Beszállítás
        </Link>
      </header>

      <Suspense fallback={<div className="h-24 bg-gray-100 animate-pulse rounded-2xl" />}>
        <DashboardStats />
      </Suspense>

      <Suspense fallback={<div>Betöltés...</div>}>
        <DashboardFilters />
      </Suspense>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-bold text-xl text-gray-800">
          <ListChecks size={24} /> Aktív Munkalapok {workOrders.length > 0 && `(${workOrders.length})`}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workOrders.map((wo) => (
            <Link 
              key={wo.id} 
              href={`/t/${wo.id}`}
              className={`group bg-white border p-5 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between ${wo.priority === 'Sürgős' ? 'border-l-4 border-l-red-500' : ''}`}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600 uppercase">
                    {wo.id.slice(-6)}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[wo.priority] || priorityColors['Normál']}`}>
                    {wo.priority}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    wo.status === 'Kész / Átvehető' 
                      ? 'bg-green-50 text-green-700 border-green-100' 
                      : wo.status === 'Javíthatatlan'
                      ? 'bg-red-50 text-red-700 border-red-100'
                      : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {wo.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">{wo.deviceType || 'Ismeretlen eszköz'}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1 mt-1 font-medium">{wo.customerName || 'Névtelen ügyfél'}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="space-y-1">
                   {wo.estimatedDone && (
                     <p className="text-[11px] text-orange-600 flex items-center gap-1 font-bold">
                       <Clock size={12} /> {wo.estimatedDone.toLocaleDateString('hu-HU')}
                     </p>
                   )}
                   <p className="text-[11px] text-gray-400 font-medium">Létrehozva: {wo.createdAt.toLocaleDateString('hu-HU')}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                  <ArrowRight className="text-gray-400 group-hover:text-blue-500" size={18} />
                </div>
              </div>
            </Link>
          ))}
          
          {workOrders.length === 0 && (
            <div className="col-span-full text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">Még nincs rögzített munkalap.</p>
              <Link href="/new" className="text-blue-500 font-bold mt-2 inline-block hover:underline">Hozd létre az elsőt!</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
