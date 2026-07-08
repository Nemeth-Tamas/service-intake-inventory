'use client';

import { useState } from 'react';
import { Video, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConditionVideoUpload({ workOrderId }: { workOrderId: string }) {
  const [uploading, setUploading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setUploading(true);
    setErrorMsg('');
    setStatusText('Videó feltöltése...');
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workOrderId', workOrderId);

    // Simulate transcode state update after 2.5 seconds
    const timeout = setTimeout(() => {
      setStatusText('Videó optimalizálása...');
    }, 2500);

    try {
      const res = await fetch('/api/condition-video', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(timeout);
      
      const data = await res.json();
      if (res.ok && data.success) {
        router.refresh();
      } else {
        setErrorMsg(data.error || 'A videó feltöltése sikertelen.');
      }
    } catch (error) {
      clearTimeout(timeout);
      console.error('Upload failed', error);
      setErrorMsg('Hálózati hiba történt a feltöltés közben.');
    } finally {
      setUploading(false);
      setStatusText('');
      // Reset the file input value so same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <label className={`flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2.5 rounded-xl font-bold transition shadow-sm ${uploading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-indigo-100/70'}`}>
          {uploading ? <Loader2 className="animate-spin text-indigo-600" size={18} /> : <Video size={18} />}
          <span>{uploading ? statusText : 'Videó rögzítése / feltöltése'}</span>
          <input
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
      {errorMsg && (
        <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 transition animate-in fade-in duration-200">
          {errorMsg}
        </div>
      )}
      <p className="text-[11px] text-gray-400 leading-normal">
        Az eredeti videó nem kerül megőrzésre. A rendszer tárhelytakarékosság miatt optimalizált videót ment.
      </p>
    </div>
  );
}
