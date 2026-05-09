'use client';

import { uploadLogo, deleteLogo, runCleanup } from '@/lib/actions';
import Link from 'next/link';
import { ArrowLeft, Save, Globe, Upload, Trash2, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { useState, useTransition } from 'react';
import Image from 'next/image';

export default function SettingsPage({ settings }: { settings: any }) {
  const [isPending, startTransition] = useTransition();
  const [cleanupResult, setCleanupCount] = useState<number | null>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    startTransition(async () => {
      await uploadLogo(formData);
    });
  }

  async function onCleanup() {
    if (!confirm('Biztosan törölni akarod a 30 napnál régebbi, lezárt munkalapok fotóit? Ez a művelet nem vonható vissza.')) return;
    
    startTransition(async () => {
      const res = await runCleanup();
      if (res.success) {
        setCleanupCount(res.purgedCount || 0);
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 w-full">
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-700 transition mb-6 font-medium"
      >
        <ArrowLeft size={20} />
        <span>Vissza a főoldalra</span>
      </Link>

      <div className="space-y-8">
        {/* Connection Settings */}
        <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
            <Globe className="text-blue-600" /> Rendszer Beállítások
          </h1>

          <form action={async (fd) => {
            const url = fd.get('baseUrl') as string;
            startTransition(async () => {
              const { updateSettings } = await import('@/lib/actions');
              await updateSettings(url);
            });
          }} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Alap URL (BASE_URL)</label>
              <input
                name="baseUrl"
                type="url"
                defaultValue={settings.baseUrl}
                placeholder="http://192.168.1.10:3000"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 font-mono text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Save size={20} /> Beállítások Mentése
            </button>
          </form>
        </div>

        {/* Branding Settings */}
        <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
            <Sparkles className="text-purple-600" /> Műhely Branding
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">Műhely Logó (PDF és Matrica fejléchez)</label>
              
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 border-2 border-dashed rounded-2xl flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                  {settings.logoPath ? (
                    <>
                      <Image 
                        src={settings.logoPath} 
                        alt="Logo" 
                        fill 
                        sizes="128px"
                        className="object-contain p-2" 
                      />
                      <button 
                        onClick={() => deleteLogo()}
                        className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={24} />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Feltöltés</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleLogoUpload}
                    disabled={isPending}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-gray-600 font-medium">Javasolt méret: <span className="text-blue-600">512x512px</span></p>
                  <p className="text-xs text-gray-400 italic">Átlátszó PNG vagy fehér hátterű JPG ajánlott a jegyzőkönyvekhez.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Settings */}
        <div className="bg-red-50 shadow-lg rounded-2xl p-8 border border-red-100">
          <h2 className="text-2xl font-bold mb-4 text-red-900 flex items-center gap-3">
            <ShieldAlert className="text-red-600" /> Karbantartás
          </h2>
          <p className="text-sm text-red-700 mb-6 font-medium">
            Tárhely felszabadítása: 30 napnál régebbi, már átadott (Kiadva) munkalapok fotóinak végleges törlése. Az archivált PDF-ek megmaradnak.
          </p>

          <button
            onClick={onCleanup}
            disabled={isPending}
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-200 disabled:opacity-50"
          >
            {isPending ? <RefreshCw className="animate-spin" /> : <Trash2 size={20} />}
            Felesleges Fotók Törlése
          </button>

          {cleanupResult !== null && (
            <div className="mt-4 p-4 bg-white border border-red-200 rounded-xl text-red-800 text-sm font-bold animate-in slide-in-from-top-2">
              Sikeres karbantartás: {cleanupResult} munkalap fotói lettek törölve.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
