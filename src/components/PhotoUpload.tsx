'use client'

import { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PhotoUpload({ workOrderId }: { workOrderId: string }) {
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
      console.error('Upload failed', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative">
      <label className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-md font-semibold cursor-pointer hover:bg-blue-200 transition">
        {uploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
        {uploading ? 'Feltöltés...' : 'Fotó hozzáadása'}
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
