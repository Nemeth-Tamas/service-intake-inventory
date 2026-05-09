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
    <div className="bg-white p-4 rounded-2xl shadow-sm border space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Keresés (név, telefon, eszköz, s/n...)"
            defaultValue={currentSearch}
            onChange={(e) => updateFilters({ q: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          {currentSearch && (
            <button 
              onClick={() => updateFilters({ q: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative md:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={currentStatus}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none bg-white cursor-pointer"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      
      {isPending && (
        <div className="text-xs text-blue-500 animate-pulse font-medium">
          Szűrés folyamatban...
        </div>
      )}
    </div>
  );
}
