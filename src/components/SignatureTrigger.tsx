'use client';

import { useState } from 'react';
import { PenTool, Check, RefreshCw } from 'lucide-react';
import { voidSignature } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Props {
  workOrderId: string;
  isWaiting?: boolean;
  hasSignature: boolean;
}

export default function SignatureTrigger({ workOrderId, hasSignature }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVoid = async () => {
    if (!confirm('Biztosan érvényteleníteni akarod az aláírást? Új aláírásra lesz szükség.')) return;
    setLoading(true);
    try {
      await voidSignature(workOrderId);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {hasSignature ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default shadow-sm text-sm">
            <Check size={18} strokeWidth={3} /> Aláírva
          </div>
          <button
            onClick={handleVoid}
            disabled={loading}
            className="p-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition border border-red-100 shadow-sm cursor-pointer"
            title="Aláírás érvénytelenítése"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      ) : (
        <Link
          href={`/sign/${workOrderId}`}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100 text-sm"
        >
          <PenTool size={18} /> Adatvédelmi Nyilatkozat Aláírása
        </Link>
      )}
    </div>
  );
}
