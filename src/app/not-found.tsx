import { Search, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-8 bg-white p-12 rounded-[3rem] shadow-xl shadow-blue-500/5 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
        
        <div className="flex justify-center">
          <div className="bg-blue-50 p-6 rounded-3xl text-blue-600 relative">
            <Search size={56} strokeWidth={2.5} />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 border-4 border-white rounded-full" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-gray-800">Az oldal nem található</h2>
          <p className="text-gray-500 font-medium">A keresett tartalom eltűnt, vagy soha nem is létezett ebben a rendszerben.</p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            <Home size={20} strokeWidth={3} /> Vissza a főoldalra
          </Link>
        </div>
      </div>
    </div>
  );
}
