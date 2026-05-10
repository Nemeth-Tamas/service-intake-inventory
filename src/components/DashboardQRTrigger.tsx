'use client';

import { useState } from 'react';
import { QrCode } from 'lucide-react';
import MobileQRScanner from './MobileQRScanner';

export default function DashboardQRTrigger() {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShowScanner(true)}
        className="sm:hidden p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-xl border border-gray-100 bg-white"
        title="QR Beolvasás"
      >
        <QrCode size={24} />
      </button>

      {showScanner && (
        <MobileQRScanner onClose={() => setShowScanner(false)} />
      )}
    </>
  );
}
