'use client';

import { deletePhoto } from '@/lib/actions';
import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';

export default function DeletePhoto({ photoId, workOrderId }: { photoId: string; workOrderId: string }) {
  const [isPending, startTransition] = useTransition();

  const onDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Biztosan törölni akarod ezt a fotót?')) return;

    startTransition(async () => {
      await deletePhoto(photoId, workOrderId);
    });
  };

  return (
    <button
      onClick={onDelete}
      disabled={isPending}
      className="absolute top-1 left-1 bg-red-600/80 backdrop-blur-sm p-1.5 rounded-full shadow-md text-white hover:bg-red-700 transition-opacity opacity-0 group-hover:opacity-100 z-10"
      title="Fotó Törlése"
    >
      <Trash2 size={14} />
    </button>
  );
}
