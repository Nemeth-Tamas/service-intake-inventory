'use client';

import { useState } from 'react';
import { Camera, Loader2, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MobileQuickActions({ workOrderId }: { workOrderId: string }) {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workOrderId', workOrderId);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Quick upload failed', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-[40] flex flex-col gap-4 sm:hidden">
      <label className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer active:scale-95 transition-transform border-4 border-white">
        {uploading ? (
          <Loader2 className="animate-spin" size={28} />
        ) : (
          <Camera size={28} />
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>
    </div>
  );
}
