'use client';

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { X, QrCode } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function MobileQRScanner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const startScanner = () => {
      const targetElement = document.getElementById("qr-reader");
      if (!targetElement) {
        console.warn("QR Reader element not found, retrying...");
        return;
      }

      // We use the high-level scanner because it's much more reliable
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          supportedScanTypes: [0]
        },
        false
      );

      const onScanSuccess = (decodedText: string) => {
        if (window.navigator.vibrate) window.navigator.vibrate(100);
        let id = decodedText;
        if (decodedText.includes('/t/')) id = decodedText.split('/t/').pop()?.split('?')[0] || decodedText;
        else if (decodedText.includes('/status/')) id = decodedText.split('/status/').pop()?.split('?')[0] || decodedText;
        
        const overlay = document.getElementById('qr-overlay');
        if (overlay) overlay.style.backgroundColor = 'rgba(34, 197, 94, 0.4)';

        scanner.clear().then(() => {
          router.push(`/t/${id}`);
          onClose();
        }).catch(() => {
          router.push(`/t/${id}`);
          onClose();
        });
      };

      scanner.render(onScanSuccess, () => {});
      return scanner;
    };

    let activeScanner: any = null;
    // Delay to ensure the portal is rendered
    const timer = setTimeout(() => {
      activeScanner = startScanner();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (activeScanner) {
        activeScanner.clear().catch((e: any) => console.error("Scanner clear error", e));
      }
    };
  }, [router, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col font-sans overflow-hidden touch-none">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-[110] bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-500/20">
            <QrCode size={24} strokeWidth={3} />
          </div>
          <div className="hidden xs:block">
            <h2 className="text-white font-black text-lg leading-none uppercase tracking-tighter">Beolvasás</h2>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-white bg-white/10 backdrop-blur-xl p-3.5 rounded-full hover:bg-white/20 transition-all active:scale-90 border border-white/10 shadow-2xl pointer-events-auto"
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
          <div className="w-64 h-64 border-2 border-white/20 rounded-[3rem] relative bg-blue-500/5 shadow-[0_0_0_100vmax_rgba(0,0,0,0.6)]">
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

      <style jsx global>{`
        @keyframes scanner-line {
          0%, 100% { transform: translateY(-100px); opacity: 0; }
          50% { transform: translateY(100px); opacity: 1; }
        }
        .animate-scanner-line {
          animation: scanner-line 2.5s ease-in-out infinite;
        }
        #qr-reader {
          border: none !important;
          background: black !important;
        }
        /* Hide all library UI elements */
        #qr-reader__status_span,
        #qr-reader__dashboard_section,
        #qr-reader img[alt="Camera"],
        #qr-reader__header_message {
          display: none !important;
        }
        #qr-reader__camera_selection {
          background: white;
          border-radius: 8px;
          padding: 4px;
          margin-bottom: 10px;
        }
        /* Allow the permission button to be visible if needed */
        #qr-reader__dashboard_section_csr button {
          background: #2563eb;
          color: white;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: bold;
          border: none;
          margin: 10px;
        }
        #qr-reader__scan_region {
           display: flex;
           justify-content: center;
           align-items: center;
        }
      `}</style>
    </div>,
    document.body
  );
}

