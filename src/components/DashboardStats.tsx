import { getDashboardStats } from '@/lib/actions';
import { AlertCircle, Clock, CheckCircle2, LayoutPanelLeft, Archive } from 'lucide-react';

export default async function DashboardStats({ currentTab }: { currentTab: string }) {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-red-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="bg-red-50 p-3 rounded-xl text-red-600">
            <AlertCircle size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Sürgős</p>
            <p className="text-3xl font-black text-red-700">{stats.urgent}</p>
          </div>
        </div>

        <div className="bg-white border border-orange-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="bg-orange-50 p-3 rounded-xl text-orange-600">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Ma esedékes</p>
            <p className="text-3xl font-black text-orange-700">{stats.today}</p>
          </div>
        </div>

        <div className="bg-white border border-green-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-xl text-green-600">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Átvehető</p>
            <p className="text-3xl font-black text-green-700">{stats.ready}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl w-fit shadow-inner">
        <a 
          href="/?tab=bench"
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
            currentTab !== 'archive' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutPanelLeft size={18} /> Munkapad ({stats.active})
        </a>
        <a 
          href="/?tab=archive"
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
            currentTab === 'archive' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Archive size={18} /> Archívum ({stats.archived})
        </a>
      </div>
    </div>
  );
}
