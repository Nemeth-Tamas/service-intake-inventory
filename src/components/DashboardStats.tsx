import { getDashboardStats } from '@/lib/actions';
import { AlertCircle, Clock, CheckCircle2, LayoutPanelLeft, Archive, Activity } from 'lucide-react';

export default async function DashboardStats({ currentTab }: { currentTab: string }) {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div className="bg-white/50 backdrop-blur-sm p-2 rounded-3xl border border-gray-100 shadow-inner flex flex-col gap-1">
        <a 
          href="/?tab=bench"
          className={`flex items-center justify-between px-6 py-4 rounded-2xl font-black transition-all duration-300 ${
            currentTab === 'bench' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-1' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutPanelLeft size={20} strokeWidth={3} /> 
            <span>Munkapad</span>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full ${currentTab === 'bench' ? 'bg-white/20' : 'bg-gray-100'}`}>
            {stats.active}
          </span>
        </a>
        <a 
          href="/?tab=archive"
          className={`flex items-center justify-between px-6 py-4 rounded-2xl font-black transition-all duration-300 ${
            currentTab === 'archive' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-1' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Archive size={20} strokeWidth={3} /> 
            <span>Archívum</span>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full ${currentTab === 'archive' ? 'bg-white/20' : 'bg-gray-100'}`}>
            {stats.archived}
          </span>
        </a>
        <a 
          href="/?tab=logs"
          className={`flex items-center justify-between px-6 py-4 rounded-2xl font-black transition-all duration-300 ${
            currentTab === 'logs' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-1' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Activity size={20} strokeWidth={3} /> 
            <span>Napló</span>
          </div>
        </a>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-4">Gyors Áttekintés</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm flex items-center gap-4 group hover:border-red-200 transition-colors">
            <div className="bg-red-50 p-3 rounded-2xl text-red-600 group-hover:scale-110 transition-transform">
              <AlertCircle size={24} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Sürgős</p>
              <p className="text-2xl font-black text-gray-900 leading-none mt-1">{stats.urgent}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm flex items-center gap-4 group hover:border-orange-200 transition-colors">
            <div className="bg-orange-50 p-3 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform">
              <Clock size={24} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Ma esedékes</p>
              <p className="text-2xl font-black text-gray-900 leading-none mt-1">{stats.today}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-colors">
            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={24} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Átvehető</p>
              <p className="text-2xl font-black text-gray-900 leading-none mt-1">{stats.ready}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
