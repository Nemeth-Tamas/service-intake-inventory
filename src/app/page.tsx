import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, ListChecks, ArrowRight, Settings as SettingsIcon, Clock, LayoutPanelLeft, Activity, PenTool, Kanban } from 'lucide-react';
import DashboardFilters from '@/components/DashboardFilters';
import DashboardStats from '@/components/DashboardStats';
import RealTimeListener from '@/components/RealTimeListener';
import DashboardQRTrigger from '@/components/DashboardQRTrigger';
import KanbanBoard from '@/components/KanbanBoard';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; tab?: string; view?: string }>;
}) {
  const { q, status, tab, view } = await searchParams;
  const currentView = view || 'list';

  const currentTab = tab || 'bench';
  const where: any = {};
  
  if (currentTab === 'archive') {
    where.status = 'Kiadva';
  } else if (currentTab === 'bench') {
    where.NOT = { status: 'Kiadva' };
  }

  // Override status filter if provided
  if (status && status !== 'Összes') {
    where.status = status;
  }

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

  // Trigger scheduled backup asynchronously if due
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (settings && settings.backupInterval !== 'none') {
    const now = new Date();
    const last = settings.lastBackupTime ? new Date(settings.lastBackupTime) : new Date(0);
    const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 65); // small buffer for runtime variations
    const limit = settings.backupInterval === 'daily' ? 24 : 168;
    if (diffHours >= limit) {
      import('@/lib/backup').then(m => m.runBackupJob()).catch(console.error);
    }
  }

  const workOrders = currentTab !== 'logs' ? await prisma.workOrder.findMany({
    where,
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  }) : [];

  const activityLogs = currentTab === 'logs' ? await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  }) : [];

  const priorityColors: Record<string, string> = {
    'Sürgős': 'text-red-600 bg-red-50 border-red-100',
    'Magas': 'text-orange-600 bg-orange-50 border-orange-100',
    'Normál': 'text-blue-600 bg-blue-50 border-blue-100',
    'Alacsony': 'text-gray-600 bg-gray-50 border-gray-100',
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <RealTimeListener event="dashboard" />
      
      <header className="relative overflow-hidden bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl shadow-blue-500/5 border border-white/20">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-2xl shadow-lg shadow-blue-200">
              <LayoutPanelLeft className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Szerviz Kezelő</h1>
              <p className="text-gray-500 font-medium mt-0.5">Professzionális munkalap nyilvántartás</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <DashboardQRTrigger />
            <Link 
              href="/settings" 
              className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-xl border border-gray-100 bg-white"
            >
              <SettingsIcon size={24} />
            </Link>
            <Link 
              href="/new" 
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-200"
            >
              <Plus size={20} strokeWidth={3} /> Új Beszállítás
            </Link>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-8">
          <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-3xl" />}>
            <DashboardStats currentTab={currentTab} />
          </Suspense>
        </aside>

        <main className="lg:col-span-3 space-y-6">
          {currentTab !== 'logs' ? (
            <>
              <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse rounded-2xl" />}>
                <DashboardFilters />
              </Suspense>

              <section className="space-y-6">
                <div className="flex items-center justify-between px-2 gap-4">
                  <h2 className="flex items-center gap-3 font-extrabold text-2xl text-gray-800">
                    <ListChecks className="text-blue-500" size={28} /> 
                    {currentTab === 'archive' ? 'Archivált Munkalapok' : 'Aktív Munkalapok'}
                    <span className="text-sm font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full ml-2">
                      {workOrders.length}
                    </span>
                  </h2>

                  {/* View Switcher Toggle */}
                  {currentTab !== 'logs' && (
                    <div className="flex bg-gray-100/80 p-1 rounded-xl items-center text-xs font-bold gap-1 shadow-inner border border-gray-200/50">
                      <Link
                        href={{
                          query: {
                            ...(q ? { q } : {}),
                            ...(status ? { status } : {}),
                            ...(tab ? { tab } : {}),
                            view: 'list'
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                          currentView === 'list' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        <ListChecks size={14} /> Lista
                      </Link>
                      <Link
                        href={{
                          query: {
                            ...(q ? { q } : {}),
                            ...(status ? { status } : {}),
                            ...(tab ? { tab } : {}),
                            view: 'kanban'
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                          currentView === 'kanban' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        <Kanban size={14} /> Kanban
                      </Link>
                    </div>
                  )}
                </div>
                
                {currentView === 'kanban' ? (
                  <KanbanBoard workOrders={workOrders} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                    {workOrders.map((wo) => (
                      <Link 
                        key={wo.id} 
                        href={`/t/${wo.id}`}
                        className={`group bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                          wo.priority === 'Sürgős' ? 'ring-2 ring-red-500/10' : ''
                        }`}
                      >
                        {wo.priority === 'Sürgős' && (
                          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-12 -mt-12 pointer-events-none" />
                        )}
                        
                        <div className="space-y-4 relative">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] font-black bg-gray-100 px-2.5 py-1 rounded-lg text-gray-500 uppercase tracking-widest">
                              #{wo.id.slice(-6)}
                            </span>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-lg border uppercase tracking-wider ${priorityColors[wo.priority] || priorityColors['Normál']}`}>
                              {wo.priority}
                            </span>
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-lg border uppercase tracking-wider ${
                              wo.status === 'Kész / Átvehető' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : wo.status === 'Javíthatatlan'
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                            }`}>
                              {wo.status}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-black text-gray-900 text-xl leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                              {wo.deviceType || 'Ismeretlen eszköz'}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                                {wo.customerName ? wo.customerName[0].toUpperCase() : '?'}
                              </div>
                              <p className="text-sm text-gray-600 font-semibold truncate">
                                {wo.customerName || 'Névtelen ügyfél'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 pt-5 border-t border-gray-50 flex items-center justify-between">
                          <div className="space-y-1.5">
                             {wo.estimatedDone && (
                               <div className="bg-orange-50 text-orange-700 text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5 w-fit">
                                 <Clock size={12} strokeWidth={3} /> {wo.estimatedDone.toLocaleDateString('hu-HU')}
                               </div>
                             )}
                             <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium ml-1">
                               <Clock size={12} /> {wo.createdAt.toLocaleDateString('hu-HU')}
                             </div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-2xl group-hover:bg-blue-600 transition-all duration-300">
                            <ArrowRight className="text-blue-600 group-hover:text-white" size={20} />
                          </div>
                        </div>
                      </Link>
                    ))}
                    
                    {workOrders.length === 0 && (
                      <div className="col-span-full text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100 shadow-inner">
                        <div className="inline-flex p-5 bg-gray-50 rounded-full mb-4">
                          <ListChecks className="text-gray-300" size={48} />
                        </div>
                        <p className="text-gray-400 font-bold text-lg">Nincsenek rögzített munkalapok.</p>
                        <p className="text-gray-400 text-sm mt-1">Kezd el a munkát egy új beszállítás rögzítésével!</p>
                        <Link href="/new" className="text-blue-600 font-black mt-6 inline-block hover:underline px-6 py-3 bg-blue-50 rounded-2xl">
                          Első Munkalap Létrehozása
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="space-y-6">
              <h2 className="flex items-center gap-3 font-extrabold text-2xl text-gray-800 px-2">
                <Activity className="text-blue-500" size={28} /> Rendszernapló
              </h2>
              
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                      <div className={`p-2.5 rounded-xl ${
                        log.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' :
                        log.type === 'WARNING' ? 'bg-rose-50 text-rose-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        <Activity size={18} strokeWidth={3} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-bold leading-snug">{log.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-400 font-medium">{log.createdAt.toLocaleString('hu-HU')}</p>
                          {log.entityId && (
                            <Link href={`/t/${log.entityId}`} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">
                              Munkalap Megnyitása
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {activityLogs.length === 0 && (
                    <div className="p-20 text-center">
                      <p className="text-gray-400 font-bold">Még nincsenek naplózott események.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
