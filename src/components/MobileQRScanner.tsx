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
    <div className="fixed inset-0 z-[100] bg-black flex flex-col font-sans overflow-hidden">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-[110] bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg">
            <QrCode size={24} strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-white font-black text-lg leading-none">Beolvasás</h2>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Munkalap azonosítás</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-white bg-white/10 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition-all active:scale-90"
        >
          <X size={28} strokeWidth={3} />
        </button>
      </div>

      {/* Main Scanner Container */}
      <div className="flex-1 relative flex items-center justify-center">
        <div 
          id="qr-reader" 
          className="w-full h-full object-cover [&>div]:!border-none [&_video]:h-full [&_video]:w-full [&_video]:object-cover" 
        />
        
        {/* Overlay Frame UI */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-white/20 rounded-[2.5rem] relative">
            {/* Corner Accents */}
            <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl" />
            <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl" />
            <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl" />
            <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-blue-500 rounded-br-2xl" />
            
            {/* Scanning Line Animation */}
            <div className="absolute inset-x-4 top-1/2 h-0.5 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>

      {/* Bottom Footer / Status */}
      <div className="p-8 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0 text-center">
        {error ? (
          <div className="bg-rose-500/20 backdrop-blur-md text-rose-300 p-4 rounded-2xl text-sm font-bold border border-rose-500/30 animate-shake">
            {error}
          </div>
        ) : (
          <p className="text-gray-400 text-sm font-medium">Helyezd a munkalap QR kódját a keretbe</p>
        )}
      </div>

      <style jsx global>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-100px); opacity: 0.2; }
          50% { transform: translateY(100px); opacity: 1; }
        }
        #qr-reader__scan_region {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        #qr-reader__dashboard {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
