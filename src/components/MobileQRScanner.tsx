'use client';

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { X, QrCode } from 'lucide-react';

export default function MobileQRScanner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        try {
          let id = decodedText;
          if (decodedText.includes('/t/')) {
            id = decodedText.split('/t/').pop()?.split('?')[0] || decodedText;
          } else if (decodedText.includes('/status/')) {
             id = decodedText.split('/status/').pop()?.split('?')[0] || decodedText;
          }
          
          scanner.clear().then(() => {
            router.push(`/t/${id}`);
            onClose();
          });
        } catch (e) {
          console.error('Scan error', e);
        }
      },
      (errorMessage) => {
        // Only log serious errors, not "no QR found" spam
        if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
          setError("A kamera hozzáférés megtagadva. Kérlek engedélyezd a böngésző beállításaiban.");
        }
      }
    );

    // Check if secure context
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setError("A kamera csak biztonságos kapcsolaton (HTTPS) vagy localhost-on érhető el. Próbáld meg engedélyezni a 'Insecure origins treated as secure' opciót a böngésződben.");
    }

    return () => {
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, [router, onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors"
      >
        <X size={32} />
      </button>

      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 bg-blue-600 rounded-2xl text-white mb-4">
            <QrCode size={40} />
          </div>
          <h2 className="text-2xl font-black text-white">QR Kód Beolvasás</h2>
          <p className="text-gray-400 font-medium text-sm">Olvasd be a munkalapon található kódot a gyors megnyitáshoz.</p>
        </div>

        <div id="qr-reader" className="overflow-hidden rounded-3xl border-4 border-white/10 bg-white/5" />
        
        {error && (
          <div className="bg-rose-500/20 text-rose-300 p-4 rounded-2xl text-sm font-bold text-center border border-rose-500/30">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
