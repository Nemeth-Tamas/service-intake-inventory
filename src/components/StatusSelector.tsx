'use client';

import { updateStatus } from '@/lib/actions';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { STATUSES } from '@/lib/validation';

const statuses = STATUSES;

export default function StatusSelector({ 
  workOrderId, 
  currentStatus 
}: { 
  workOrderId: string; 
  currentStatus: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    setIsOpen(false);
    try {
      await updateStatus(workOrderId, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Hiba történt a státusz frissítésekor.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm transition-all border ${
          isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
        } ${
          currentStatus === 'Kész / Átvehető' 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : currentStatus === 'Javíthatatlan'
            ? 'bg-red-100 text-red-800 border-red-200'
            : 'bg-blue-100 text-blue-800 border-blue-200'
        }`}
      >
        {isUpdating ? 'Frissítés...' : currentStatus}
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-20" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-xl z-30 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  status === currentStatus 
                    ? 'bg-blue-50 text-blue-700 font-bold' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
