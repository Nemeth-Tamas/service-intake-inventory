'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import { updateStatus } from '@/lib/actions';
import { STATUSES } from '@/lib/validation';

interface KanbanBoardProps {
  workOrders: any[];
}

export default function KanbanBoard({ workOrders }: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (activeColumn !== status) {
      setActiveColumn(status);
    }
  };

  const handleDragLeave = () => {
    setActiveColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setActiveColumn(null);
    if (!draggedId) return;

    const id = draggedId;
    setDraggedId(null);

    // If status didn't change, do nothing
    const order = workOrders.find(wo => wo.id === id);
    if (order?.status === status) return;

    setUpdatingId(id);
    try {
      await updateStatus(id, status);
    } catch (err) {
      console.error('Failed to drop / update status:', err);
      alert('Nem sikerült módosítani a státuszt.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Group work orders by status
  const ordersByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = workOrders.filter(wo => wo.status === status);
    return acc;
  }, {} as Record<string, any[]>);

  const priorityColors: Record<string, string> = {
    'Sürgős': 'text-red-600 bg-red-50 border-red-100',
    'Magas': 'text-orange-600 bg-orange-50 border-orange-100',
    'Normál': 'text-blue-600 bg-blue-50 border-blue-100',
    'Alacsony': 'text-gray-600 bg-gray-50 border-gray-100',
  };

  return (
    <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-thin select-none">
      {STATUSES.map((status) => {
        const columnOrders = ordersByStatus[status] || [];
        const isHovered = activeColumn === status;

        return (
          <div
            key={status}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
            className={`w-80 flex-shrink-0 bg-gray-50/60 border rounded-3xl p-4 flex flex-col min-h-[600px] transition-all duration-200 ${
              isHovered 
                ? 'bg-blue-50/50 border-blue-300 border-dashed scale-[1.01]' 
                : 'border-gray-100'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-1.5">
              <h3 className="font-extrabold text-sm text-gray-700 tracking-wide truncate max-w-[200px]" title={status}>
                {status}
              </h3>
              <span className="bg-gray-200/80 text-gray-500 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {columnOrders.length}
              </span>
            </div>

            {/* Card List */}
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[700px] pr-1">
              {columnOrders.map((wo) => {
                const isUpdating = updatingId === wo.id;
                return (
                  <div
                    key={wo.id}
                    draggable={!isUpdating}
                    onDragStart={() => handleDragStart(wo.id)}
                    className={`group bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-grab active:cursor-grabbing relative overflow-hidden ${
                      wo.priority === 'Sürgős' ? 'border-l-4 border-l-red-500' : ''
                    } ${isUpdating ? 'opacity-40 pointer-events-none' : ''}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase">
                          #{wo.id.slice(-6)}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${priorityColors[wo.priority] || priorityColors['Normál']}`}>
                          {wo.priority}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
                          {wo.deviceType || 'Ismeretlen eszköz'}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1.5 font-medium truncate">
                          Ügyfél: {wo.customerName || 'Névtelen'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 font-semibold">
                        <div className="space-y-1">
                          {wo.estimatedDone && (
                            <p className="text-orange-600 font-bold flex items-center gap-1">
                              <Clock size={10} /> {new Date(wo.estimatedDone).toLocaleDateString('hu-HU')}
                            </p>
                          )}
                          <p>Felvéve: {new Date(wo.createdAt).toLocaleDateString('hu-HU')}</p>
                        </div>
                        <Link
                          href={`/t/${wo.id}`}
                          className="bg-blue-50 p-2 rounded-xl group-hover:bg-blue-600 transition-colors"
                        >
                          <ArrowRight className="text-blue-600 group-hover:text-white" size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              {columnOrders.length === 0 && (
                <div className="flex-1 flex items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-2xl bg-white/40">
                  <p className="text-xs text-gray-300 font-bold uppercase tracking-widest">Üres oszlop</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
