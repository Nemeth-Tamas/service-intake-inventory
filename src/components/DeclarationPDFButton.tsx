'use client';

import { Download } from 'lucide-react';

interface Props {
  workOrder: {
    id: string;
  };
}

export default function DeclarationPDFButton({ workOrder }: Props) {
  const handleClick = () => {
    window.open(`/api/pdf/declaration/${workOrder.id}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition shadow-sm font-bold text-sm w-full justify-center cursor-pointer"
    >
      <Download size={16} /> Nyilatkozat Letöltése
    </button>
  );
}
