'use client';

import { Printer } from 'lucide-react';

interface Props {
  workOrder: {
    id: string;
  };
}

export default function PDFButton({ workOrder }: Props) {
  const handleClick = () => {
    window.open(`/api/pdf/${workOrder.id}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 bg-gray-800 text-white px-6 py-4 rounded-xl shadow-lg font-bold hover:bg-black transition w-full justify-center text-lg cursor-pointer"
    >
      <Printer size={22} /> Jegyzőkönyv (PDF)
    </button>
  );
}
