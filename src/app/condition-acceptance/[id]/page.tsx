import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ConditionAcceptanceCanvas from '@/components/ConditionAcceptanceCanvas';
import { ShieldCheck } from 'lucide-react';
import { getSettings } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function ConditionAcceptancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = await getSettings();

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { createdAt: 'desc' } },
      conditionVideos: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!workOrder) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 md:p-8">
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 leading-tight">Átvételi Állapot Elfogadás</h1>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Munkalap: #{id.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Dátum</p>
            <p className="text-sm font-bold text-gray-900">{new Date().toLocaleDateString('hu-HU')}</p>
          </div>
        </header>

        <ConditionAcceptanceCanvas 
          workOrder={workOrder} 
          acceptanceText={settings.conditionAcceptanceTemplate} 
        />

        <footer className="mt-auto text-center pt-6 border-t border-gray-100">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
            Cellnet Kft. Szerviz • Állapot Nyilatkozat iPad Terminál
          </p>
        </footer>
      </div>
    </div>
  );
}
