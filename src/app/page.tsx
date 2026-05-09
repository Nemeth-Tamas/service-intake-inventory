import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, ListChecks, ArrowRight } from 'lucide-react';

export default async function Home() {
  const workOrders = await prisma.workOrder.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Szerviz Kezelő</h1>
          <p className="text-gray-500">Beszállítások és nyilvántartás</p>
        </div>
        <Link 
          href="/new" 
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          <Plus size={20} /> Új Beszállítás
        </Link>
      </header>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-bold text-xl text-gray-800">
          <ListChecks size={24} /> Aktív Munkalapok
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          {workOrders.map((wo) => (
            <Link 
              key={wo.id} 
              href={`/t/${wo.id}`}
              className="group bg-white border p-4 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md transition flex justify-between items-center"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                    {wo.id.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {wo.status}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800">{wo.deviceType || 'Ismeretlen eszköz'}</h3>
                <p className="text-sm text-gray-500">{wo.customerName || 'Névtelen ügyfél'}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-400">Létrehozva</p>
                  <p className="text-sm font-medium text-gray-600">{wo.createdAt.toLocaleDateString('hu-HU')}</p>
                </div>
                <ArrowRight className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition" size={20} />
              </div>
            </Link>
          ))}
          
          {workOrders.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400">Még nincs rögzített munkalap.</p>
              <Link href="/new" className="text-blue-500 font-semibold mt-2 inline-block">Hozd létre az elsőt!</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
