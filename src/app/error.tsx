'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-8 bg-white p-10 rounded-[2.5rem] shadow-xl shadow-blue-500/5 border border-gray-100">
        <div className="flex justify-center">
          <div className="bg-rose-50 p-5 rounded-3xl text-rose-600 animate-pulse">
            <AlertTriangle size={48} strokeWidth={2.5} />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Hoppá! Hiba történt</h1>
          <p className="text-gray-500 font-medium">Valami váratlan hiba szakította meg a folyamatot.</p>
          {error.digest && (
            <p className="text-[10px] font-mono text-gray-300 uppercase tracking-widest mt-4">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            <RefreshCcw size={20} strokeWidth={3} /> Újrapróbálkozás
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full bg-gray-50 text-gray-600 px-6 py-4 rounded-2xl font-black hover:bg-gray-100 transition-all active:scale-95"
          >
            <Home size={20} strokeWidth={3} /> Vissza a főoldalra
          </Link>
        </div>
      </div>
    </div>
  );
}
