'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';
import { useTransition } from 'react';

const statuses = [
  'Összes',
  'Átvétel alatt',
  'Bevizsgálás alatt',
  'Alkatrészre vár',
  'Javítás folyamatban',
  'Tesztelés alatt',
  'Kész / Átvehető',
  'Kiadva',
  'Javíthatatlan'
];

export default function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get('q') || '';
  const currentStatus = searchParams.get('status') || 'Összes';

  function updateFilters(updates: { q?: string; status?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.q !== undefined) {
      if (updates.q) params.set('q', updates.q);
      else params.delete('q');
    }
    
    if (updates.status !== undefined) {
      if (updates.status && updates.status !== 'Összes') params.set('status', updates.status);
      else params.delete('status');
    }

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  return (
    <div className="bg-white/40 backdrop-blur-md p-3 rounded-3xl shadow-sm border border-white/50 space-y-3">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Keresés (név, telefon, eszköz, s/n...)"
            defaultValue={currentSearch}
            onChange={(e) => updateFilters({ q: e.target.value })}
            className="w-full pl-12 pr-4 py-3.5 bg-white/60 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-gray-700 placeholder:text-gray-400 shadow-inner"
          />
          {currentSearch && (
            <button 
              onClick={() => updateFilters({ q: '' })}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative md:w-72 group">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <select
            value={currentStatus}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="w-full pl-12 pr-10 py-3.5 bg-white/60 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer font-bold text-gray-700 shadow-inner"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      {isPending && (
        <div className="flex items-center gap-2 px-4 text-[10px] text-blue-600 font-black uppercase tracking-widest animate-pulse">
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
          Szűrés folyamatban...
        </div>
      )}
    </div>
  );
}
