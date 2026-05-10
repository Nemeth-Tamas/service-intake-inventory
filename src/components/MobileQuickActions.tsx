'use client';

import { useState } from 'react';
import { Camera, Loader2, Zap, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MobileQRScanner from './MobileQRScanner';

export default function MobileQuickActions({ workOrderId }: { workOrderId: string }) {
  const [uploading, setUploading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
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

  const copyStatusLink = () => {
    const shortId = workOrderId.slice(-6);
    const url = `${window.location.origin}/status/${shortId}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        alert('Rövidített állapot követő link másolva a vágólapra!');
      });
    } else {
      // Fallback for non-secure origins
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Rövidített állapot követő link másolva a vágólapra! (Fallback)');
      } catch (err) {
        alert('Másolás sikertelen. Kérlek másold ki kézzel: ' + url);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <>
      <div className="fixed bottom-24 right-6 z-[40] flex flex-col gap-4 sm:hidden">
        <button 
          onClick={() => setShowScanner(true)}
          className="w-16 h-16 bg-white text-blue-600 rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform border-4 border-white"
          title="QR Beolvasás"
        >
          <QrCode size={28} />
        </button>

        <button 
          onClick={copyStatusLink}
          className="w-16 h-16 bg-emerald-500 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform border-4 border-white"
          title="Állapot link másolása"
        >
          <Zap size={28} />
        </button>
        
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

      {showScanner && (
        <MobileQRScanner onClose={() => setShowScanner(false)} />
      )}
    </>
  );
}
