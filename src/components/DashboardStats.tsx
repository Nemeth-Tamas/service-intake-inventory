import { getDashboardStats } from '@/lib/actions';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export default async function DashboardStats() {
  const stats = await getDashboardStats();

  return (
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
  );
}
