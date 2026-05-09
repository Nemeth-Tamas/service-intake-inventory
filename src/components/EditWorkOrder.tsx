'use client';

import { updateWorkOrderDetails } from '@/lib/actions';
import { Edit2, Save, X } from 'lucide-react';
import { useState, useTransition } from 'react';

export default function EditWorkOrder({ workOrder }: { workOrder: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isEditing) {
    return (
      <button 
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-sm transition"
      >
        <Edit2 size={16} /> Szerkesztés
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <form 
        action={async (fd) => {
          startTransition(async () => {
            await updateWorkOrderDetails(fd);
            setIsEditing(false);
          });
        }}
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Munkalap Szerkesztése</h2>
          <button type="button" onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 transition">
            <X size={28} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          <input type="hidden" name="id" value={workOrder.id} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-blue-600 uppercase text-xs tracking-widest">Ügyfél Adatok</h3>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Név</label>
                <input name="customerName" defaultValue={workOrder.customerName || ''} className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Kapcsolat</label>
                <input name="customerContact" defaultValue={workOrder.customerContact || ''} className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-blue-600 uppercase text-xs tracking-widest">Eszköz & Határidő</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Típus</label>
                  <input name="deviceType" defaultValue={workOrder.deviceType || ''} className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">S/N</label>
                  <input name="serialNumber" defaultValue={workOrder.serialNumber || ''} className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Várható elkészülés</label>
                <input 
                  type="date" 
                  name="estimatedDone" 
                  defaultValue={workOrder.estimatedDone ? new Date(workOrder.estimatedDone).toISOString().split('T')[0] : ''} 
                  className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-bold text-blue-600 uppercase text-xs tracking-widest">Műszaki Leírás</h3>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Eszköz Állapota</label>
              <textarea name="condition" defaultValue={workOrder.condition || ''} rows={2} className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Hiba Leírása</label>
              <textarea name="complaint" defaultValue={workOrder.complaint || ''} rows={3} className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t flex gap-4">
          <button 
            type="button" 
            onClick={() => setIsEditing(false)}
            className="flex-1 py-3 px-6 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition"
          >
            Mégse
          </button>
          <button 
            type="submit" 
            disabled={isPending}
            className="flex-[2] py-3 px-6 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isPending ? 'Mentés...' : <><Save size={20} /> Változtatások Mentése</>}
          </button>
        </div>
      </form>
    </div>
  );
}
