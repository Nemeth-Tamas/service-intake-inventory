'use client';

import { Download } from 'lucide-react';

interface Props {
  workOrder: {
    id: string;
  };
}

export default function ConditionAcceptancePDFButton({ workOrder }: Props) {
  const handleClick = () => {
    window.open(`/api/pdf/condition-acceptance/${workOrder.id}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl border border-indigo-200 hover:bg-indigo-100/70 transition shadow-sm font-bold text-sm w-full justify-center cursor-pointer"
    >
      <Download size={16} /> Átvételi Nyilatkozat Letöltése
    </button>
  );
}
