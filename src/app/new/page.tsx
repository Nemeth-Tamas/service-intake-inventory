import { createWorkOrder } from '@/lib/actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewWorkOrder() {
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 w-full">
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-700 transition mb-6"
      >
        <ArrowLeft size={20} />
        <span>Vissza a főoldalra</span>
      </Link>
      <div className="bg-card shadow-lg rounded-lg p-6 sm:p-10 border border-gray-200">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">Új Beszállítás</h1>
        <form action={createWorkOrder} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Ügyfél Neve</label>
              <input
                name="customerName"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Példa János"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Elérhetőség (Telefon/Email)</label>
              <input
                name="customerContact"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="+36 30 123 4567"
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Prioritás</label>
                <select
                  name="priority"
                  defaultValue="Normál"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                >
                  <option value="Sürgős">Sürgős (Azonnal)</option>
                  <option value="Magas">Magas</option>
                  <option value="Normál">Normál</option>
                  <option value="Alacsony">Alacsony</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Várható elkészülés</label>
                <input
                  name="estimatedDone"
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Eszköz Típusa</label>
                <input
                  name="deviceType"
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Laptop, PC, Monitor..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Sorozatszám / ID</label>
                <input
                  name="serialNumber"
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="S/N: 12345678"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Eszköz Állapota</label>
            <textarea
              name="condition"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              rows={3}
              placeholder="Karcok a fedélen, kijelző ép..."
            ></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Átvett Tartozékok</label>
              <input
                name="accessories"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Töltő, táska, egér..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Várható Költség (Ft)</label>
              <input
                name="estimatedPrice"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Például: 15.000 Ft"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Hiba Leírása</label>
            <textarea
              name="complaint"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              rows={3}
              placeholder="Nem kapcsol be, hangos hűtés..."
            ></textarea>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Garancia (időtartam)</label>
                <input
                  name="warranty"
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="pl. 6 hónap"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Garancia Lejárata</label>
                <input
                  name="warrantyExpiry"
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-700 text-white py-4 rounded-md font-bold text-lg hover:bg-blue-800 shadow-md hover:shadow-lg transition-all transform active:scale-[0.98]"
          >
            Munkalap Létrehozása
          </button>
        </form>
      </div>
    </div>
  );
}
