import { getPreviousRepairs } from '@/lib/actions';
import { History, Clock, FileText, ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default async function DeviceHistory({ serialNumber, currentId }: { serialNumber: string, currentId: string }) {
  const previousRepairs = await getPreviousRepairs(serialNumber, currentId);

  if (previousRepairs.length === 0) return null;

  return (
    <section className="bg-white border p-6 rounded-2xl shadow-sm space-y-4">
      <h2 className="flex items-center gap-2 font-bold text-xl text-blue-800">
        <History size={24} /> Korábbi Javítások Erre az Eszközre
      </h2>
      <p className="text-sm text-gray-500 italic">Serial Number: <span className="font-mono font-bold text-gray-700">{serialNumber}</span></p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {previousRepairs.map((repair) => (
          <Link 
            key={repair.id} 
            href={`/t/${repair.id}`}
            className="group border border-gray-100 p-4 rounded-xl hover:border-blue-300 hover:shadow-md transition bg-gray-50/50"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-gray-100 uppercase font-mono">
                {repair.id.slice(-6)}
              </span>
              <span className="text-[10px] font-bold text-gray-400">{repair.createdAt.toLocaleDateString('hu-HU')}</span>
            </div>
            <p className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600">{repair.status}</p>
            <div className="mt-3 flex gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
              <span className="flex items-center gap-1"><FileText size={12} /> {repair.notes.length} Jegyzet</span>
              <span className="flex items-center gap-1"><ImageIcon size={12} /> {repair.photos.length} Fotó</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
