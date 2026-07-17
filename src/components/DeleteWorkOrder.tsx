'use client';

import { deleteWorkOrder } from '@/lib/actions';
import { Trash2, RefreshCw } from 'lucide-react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteWorkOrder({ workOrderId }: { workOrderId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onDelete = async () => {
    if (!confirm('BIZTOSAN TÖRÖLNI AKAROD ezt a munkalapot? Minden adat, fotó és PDF véglegesen elvész!')) return;

    startTransition(async () => {
      try {
        const res = await deleteWorkOrder(workOrderId);
        if (res && res.success) {
          router.push('/');
          router.refresh();
        } else {
          alert('Hiba történt a törlés során.');
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('Hiba történt a törlés során.');
      }
    });
  };

  return (
    <button
      onClick={onDelete}
      disabled={isPending}
      className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition border border-red-200 disabled:opacity-50"
      title="Munkalap Végleges Törlése"
    >
      {isPending ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
      Törlés
    </button>
  );
}

