'use client';

import { addLineItem, deleteLineItem } from '@/lib/actions';
import { Plus, Trash2, Receipt, CreditCard } from 'lucide-react';
import { useState, useTransition } from 'react';

export default function FinancialTracker({ workOrderId, lineItems }: { workOrderId: string, lineItems: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const total = lineItems.reduce((sum, item) => sum + item.amount, 0);

  async function onAdd() {
    if (!description || !amount) return;
    const fd = new FormData();
    fd.append('workOrderId', workOrderId);
    fd.append('description', description);
    fd.append('amount', amount);
    
    startTransition(async () => {
      await addLineItem(fd);
      setDescription('');
      setAmount('');
    });
  }

  return (
    <section className="bg-white border p-6 rounded-2xl shadow-sm space-y-6">
      <h2 className="flex items-center gap-2 font-bold text-xl text-gray-800 border-b pb-4">
        <Receipt size={24} className="text-green-600" /> Alkatrészek és Munkadíj
      </h2>

      <div className="space-y-3">
        {lineItems.map((item) => (
          <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 group">
            <div className="flex-1">
              <p className="font-bold text-gray-800">{item.description}</p>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{new Date(item.createdAt).toLocaleDateString('hu-HU')}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-black text-blue-700">{item.amount.toLocaleString('hu-HU')} Ft</span>
              <button 
                onClick={() => { if(confirm('Törlöd ezt a tételt?')) deleteLineItem(item.id, workOrderId); }}
                className="text-gray-300 hover:text-red-600 transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {lineItems.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-4 italic">Még nincsenek rögzített tételek.</p>
        )}
      </div>

      {/* Add New Item */}
      <div className="flex flex-col sm:flex-row gap-3 bg-green-50/50 p-4 rounded-2xl border border-green-100">
        <input 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tétel (pl: Új Kijelző)"
          className="flex-[2] p-2.5 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-green-500 text-sm"
        />
        <div className="relative flex-1">
          <input 
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Összeg"
            className="w-full p-2.5 pl-4 pr-10 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-green-500 text-sm font-bold"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Ft</span>
        </div>
        <button 
          onClick={onAdd}
          disabled={isPending}
          className="bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-green-700 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="pt-4 border-t flex justify-between items-center">
        <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Végösszeg</span>
        <span className="text-2xl font-black text-green-700 flex items-center gap-2">
          <CreditCard size={24} /> {total.toLocaleString('hu-HU')} Ft
        </span>
      </div>
    </section>
  );
}
