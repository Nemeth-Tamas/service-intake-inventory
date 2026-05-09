'use client';

import { updatePriority } from '@/lib/actions';
import { useState } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

const priorities = ['Sürgős', 'Magas', 'Normál', 'Alacsony'];

export default function PrioritySelector({ 
  workOrderId, 
  currentPriority 
}: { 
  workOrderId: string; 
  currentPriority: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePriorityChange = async (newPriority: string) => {
    if (newPriority === currentPriority) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    setIsOpen(false);
    try {
      await updatePriority(workOrderId, newPriority);
    } catch (error) {
      console.error('Failed to update priority:', error);
      alert('Hiba történt a prioritás frissítésekor.');
    } finally {
      setIsUpdating(false);
    }
  };

  const priorityColors: Record<string, string> = {
    'Sürgős': 'bg-red-100 text-red-700 border-red-200',
    'Magas': 'bg-orange-100 text-orange-700 border-orange-200',
    'Normál': 'bg-blue-100 text-blue-700 border-blue-200',
    'Alacsony': 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
          isUpdating ? 'opacity-50' : 'hover:shadow-sm'
        } ${priorityColors[currentPriority] || priorityColors['Normál']}`}
      >
        <AlertCircle size={12} />
        {isUpdating ? '...' : currentPriority}
        <ChevronDown size={10} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1 w-32 bg-white border rounded-xl shadow-xl z-30 py-1 overflow-hidden">
            {priorities.map((p) => (
              <button
                key={p}
                onClick={() => handlePriorityChange(p)}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  p === currentPriority ? 'bg-gray-50 font-bold' : 'hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
