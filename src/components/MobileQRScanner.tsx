'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { X, QrCode } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function MobileQRScanner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    setMounted(true);
    
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        const config = { 
          fps: 20, // Increased FPS for faster detection
          qrbox: { width: 300, height: 300 }, // Larger scanning area
          aspectRatio: window.innerHeight / window.innerWidth
        };

        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            // Haptic feedback if supported
            if (window.navigator.vibrate) {
              window.navigator.vibrate(100);
            }
            
            let id = decodedText;
            if (decodedText.includes('/t/')) {
              id = decodedText.split('/t/').pop()?.split('?')[0] || decodedText;
            } else if (decodedText.includes('/status/')) {
               id = decodedText.split('/status/').pop()?.split('?')[0] || decodedText;
            }
            
            // Visual feedback - flash the screen green briefly
            const overlay = document.getElementById('qr-overlay');
            if (overlay) overlay.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';

            scanner.stop().then(() => {
              router.push(`/t/${id}`);
              onClose();
            }).catch(() => {
              router.push(`/t/${id}`);
              onClose();
            });
          },
          undefined
        );
      } catch (err: any) {
        console.error("Scanner start error:", err);
        setError("Kamera hiba: " + (err.message || "Ismeretlen hiba"));
      }
    };

    // Small delay to ensure the DOM element is ready
    const timer = setTimeout(startScanner, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(e => console.error("Cleanup stop error", e));
      }
    };
  }, [router, onClose]);

  if (!mounted) return null;

  // Use Portal to render at the top of the DOM, bypassing any relative/overflow parent constraints
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col font-sans overflow-hidden touch-none">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-[110] bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-500/20">
            <QrCode size={24} strokeWidth={3} />
          </div>
          <div className="hidden sm:block md:block lg:block xl:block">
            <h2 className="text-white font-black text-lg leading-none">Beolvasás</h2>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Munkalap azonosítás</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-white bg-white/10 backdrop-blur-xl p-3.5 rounded-full hover:bg-white/20 transition-all active:scale-90 border border-white/10 shadow-2xl"
        >
          <X size={28} strokeWidth={3} />
        </button>
      </div>

      {/* Main Scanner Container */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        <div 
          id="qr-reader" 
          className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" 
        />
        
        {/* Overlay Frame UI */}
        <div id="qr-overlay" className="absolute inset-0 pointer-events-none flex items-center justify-center transition-colors duration-300">
          <div className="w-72 h-72 border-2 border-white/10 rounded-[3rem] relative bg-blue-500/5 shadow-[0_0_0_100vmax_rgba(0,0,0,0.5)]">
            {/* Corner Accents */}
            <div className="absolute -top-1 -left-1 w-12 h-12 border-t-8 border-l-4 border-blue-500 rounded-tl-3xl" />
            <div className="absolute -top-1 -right-1 w-12 h-12 border-t-8 border-r-4 border-blue-500 rounded-tr-3xl" />
            <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-8 border-l-4 border-blue-500 rounded-bl-3xl" />
            <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-8 border-r-4 border-blue-500 rounded-br-3xl" />
            
            {/* Scanning Line Animation */}
            <div className="absolute inset-x-6 top-1/2 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_20px_rgba(96,165,250,0.8)] animate-scanner-line" />
          </div>
        </div>
      </div>

      {/* Bottom Footer / Status */}
      <div className="p-10 bg-gradient-to-t from-black/90 to-transparent absolute bottom-0 left-0 right-0 text-center">
        {error ? (
          <div className="bg-rose-500/20 backdrop-blur-md text-rose-300 p-5 rounded-[2rem] text-sm font-bold border border-rose-500/30">
            {error}
          </div>
        ) : (
          <p className="text-gray-400 text-sm font-bold tracking-wide uppercase">Helyezd a munkalap QR kódját a keretbe</p>
        )}
      </div>

      <style jsx global>{`
        @keyframes scanner-line {
          0%, 100% { transform: translateY(-110px); opacity: 0; }
          50% { transform: translateY(110px); opacity: 1; }
        }
        .animate-scanner-line {
          animation: scanner-line 2.5s ease-in-out infinite;
        }
        #qr-reader {
          background: black !important;
        }
      `}</style>
    </div>,
    document.body
  );
}
