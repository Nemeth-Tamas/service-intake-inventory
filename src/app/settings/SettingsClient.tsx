'use client';

import { uploadLogo, deleteLogo, runCleanup, updateSettings, updateRepresentativeSignature, triggerManualBackup, triggerRestoreBackup } from '@/lib/actions';
import Link from 'next/link';
import { ArrowLeft, Save, Globe, Upload, Trash2, ShieldAlert, Sparkles, RefreshCw, Database, HardDrive, UserCheck, PenTool, Eraser, Check } from 'lucide-react';
import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import RichTextEditor from '@/components/RichTextEditor';
import SignaturePad from 'react-signature-canvas';

export default function SettingsClient({ settings, storage }: { settings: any, storage: any }) {
  const [isPending, startTransition] = useTransition();
  const [cleanupResult, setCleanupCount] = useState<number | null>(null);
  const [declarationTemplate, setDeclarationTemplate] = useState(settings.declarationTemplate);
  const sigPad = useRef<SignaturePad>(null);

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
        {/* Connection & Branding Settings */}
        <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
          <h1 className="text-2xl font-bold mb-8 text-gray-900 flex items-center gap-3">
            <Globe className="text-blue-600" /> Rendszer & Branding
          </h1>

          <form action={async (fd) => {
            const url = fd.get('baseUrl') as string;
            const wName = fd.get('workshopName') as string;
            const tName = fd.get('technicianName') as string;
            const address = fd.get('address') as string;
            const phone = fd.get('phone') as string;
            const email = fd.get('email') as string;
            const website = fd.get('website') as string;
            const googleReviewUrl = fd.get('googleReviewUrl') as string;
            const backupInterval = fd.get('backupInterval') as string;
            const nasBackupPath = fd.get('nasBackupPath') as string;
            const smtpHost = fd.get('smtpHost') as string;
            const smtpPort = fd.get('smtpPort') as string;
            const smtpUser = fd.get('smtpUser') as string;
            const smtpPass = fd.get('smtpPass') as string;
            const smtpFrom = fd.get('smtpFrom') as string;
            const smsApiUrl = fd.get('smsApiUrl') as string;
            const smsApiKey = fd.get('smsApiKey') as string;
            const smsSender = fd.get('smsSender') as string;
            // The template is now handled by the React state, not the native FormData
            startTransition(async () => {
              try {
                await updateSettings(
                  url, 
                  wName, 
                  tName, 
                  address, 
                  phone, 
                  email, 
                  website, 
                  googleReviewUrl, 
                  declarationTemplate,
                  backupInterval,
                  nasBackupPath,
                  smtpHost,
                  smtpPort,
                  smtpUser,
                  smtpPass,
                  smtpFrom,
                  smsApiUrl,
                  smsApiKey,
                  smsSender
                );
                alert('Beállítások sikeresen elmentve!');
              } catch (err: any) {
                alert(err.message || 'Mentés sikertelen');
              }
            });
          }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Network Settings */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hálózati Beállítás</h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Alap URL (BASE_URL)</label>
                  <input
                    name="baseUrl"
                    type="url"
                    defaultValue={settings.baseUrl}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 font-mono text-sm"
                    required
                  />
                </div>
              </div>

              {/* Workshop Identity */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <UserCheck size={14} /> Műhely Adatok
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Műhely Neve</label>
                  <input
                    name="workshopName"
                    type="text"
                    defaultValue={settings.workshopName}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Technikus Neve</label>
                  <input
                    name="technicianName"
                    type="text"
                    defaultValue={settings.technicianName || ''}
                    placeholder="Példa János"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50"
                  />
                </div>
              </div>

              {/* Contact Details (New) */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Elérhetőségi Adatok (Blokkhoz)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cím</label>
                    <input
                      name="address"
                      type="text"
                      defaultValue={settings.address || ''}
                      placeholder="1234 Budapest, Példa utca 12."
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Telefonszám</label>
                    <input
                      name="phone"
                      type="text"
                      defaultValue={settings.phone || ''}
                      placeholder="+36 30 123 4567"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      name="email"
                      type="email"
                      defaultValue={settings.email || ''}
                      placeholder="info@szerviz.hu"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Weboldal</label>
                    <input
                      name="website"
                      type="text"
                      defaultValue={settings.website || ''}
                      placeholder="www.szerviz.hu"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Google Értékelés Link (QR kódhoz)</label>
                    <input
                      name="googleReviewUrl"
                      type="url"
                      defaultValue={settings.googleReviewUrl || ''}
                      placeholder="https://g.page/r/your-id/review"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Backup Schedule Settings */}
              <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Database size={14} /> Automatikus Biztonsági Mentés Ütemezése
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mentési Gyakoriság</label>
                    <select
                      name="backupInterval"
                      defaultValue={settings.backupInterval || 'none'}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 font-medium text-gray-700"
                    >
                      <option value="none">Nincs automatikus mentés</option>
                      <option value="daily">Naponta (24 óránként)</option>
                      <option value="weekly">Hetente (7 naponta)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">NAS / Synology Elérési Út (Opcionális)</label>
                    <input
                      name="nasBackupPath"
                      type="text"
                      defaultValue={settings.nasBackupPath || ''}
                      placeholder="Például: /mnt/backup"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Email Notification SMTP Settings */}
              <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Database size={14} className="text-blue-500" /> Email Értesítések SMTP Beállításai
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Host</label>
                    <input
                      name="smtpHost"
                      type="text"
                      defaultValue={settings.smtpHost || ''}
                      placeholder="smtp.example.com"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Port</label>
                    <input
                      name="smtpPort"
                      type="number"
                      defaultValue={settings.smtpPort || ''}
                      placeholder="587"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Feladó Email Címe (From)</label>
                    <input
                      name="smtpFrom"
                      type="email"
                      defaultValue={settings.smtpFrom || ''}
                      placeholder="szerviz@example.com"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Felhasználónév</label>
                    <input
                      name="smtpUser"
                      type="text"
                      defaultValue={settings.smtpUser || ''}
                      placeholder="user@example.com"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 font-mono text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Jelszó</label>
                    <input
                      name="smtpPass"
                      type="password"
                      defaultValue={settings.smtpPass || ''}
                      placeholder="••••••••••••"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* SMS Notification Gateway Settings */}
              <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Database size={14} className="text-purple-500" /> SMS Értesítések API Gateway Beállításai
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SMS Gateway API URL</label>
                    <input
                      name="smsApiUrl"
                      type="url"
                      defaultValue={settings.smsApiUrl || ''}
                      placeholder="https://api.sms-gateway.com/send"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      SeeMe.hu: <code>https://seeme.hu/gateway</code> | BulkGate: <code>https://portal.bulkgate.com/api/1.0/simple/transactional</code>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SMS Küldő Neve (Sender ID)</label>
                    <input
                      name="smsSender"
                      type="text"
                      defaultValue={settings.smsSender || ''}
                      placeholder="CellnetSzerv"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Opcionális (pl. <code>Cellnet</code>, előzetesen jóvá kell hagyatni a szolgáltatónál).
                    </p>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">API Key / Token</label>
                    <input
                      name="smsApiKey"
                      type="password"
                      defaultValue={settings.smsApiKey || ''}
                      placeholder="••••••••••••••••••••••••••••••••"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      SeeMe API kulcs. BulkGate esetén használd az <code>ApplicationID:ApplicationToken</code> formátumot kettősponttal elválasztva.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aláírási Nyilatkozat Szövege</h3>
              <p className="text-xs text-gray-500 italic">Ez a szöveg jelenik meg az iPad-en aláírás előtt, és ez kerül a PDF mellékletre is.</p>
              <RichTextEditor value={declarationTemplate} onChange={setDeclarationTemplate} />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              <Save size={20} /> Összes Beállítás Mentése
            </button>
          </form>
        </div>

        {/* Logo Upload */}
        <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
            <Sparkles className="text-purple-600" /> Vizuális Megjelenés
          </h2>

          <div className="flex flex-col md:flex-row items-center gap-8 bg-gray-50 p-6 rounded-3xl border border-gray-100">
            <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-3xl flex items-center justify-center bg-white overflow-hidden relative group shadow-inner">
              {settings.logoPath ? (
                <>
                  <Image 
                    src={`/api/media${settings.logoPath}`} 
                    alt="Logo" 
                    fill 
                    unoptimized
                    sizes="160px"
                    className="object-contain p-4" 
                  />
                  <button 
                    onClick={() => { if(confirm('Törlöd a logót?')) deleteLogo(); }}
                    className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={32} />
                  </button>
                </>
              ) : (
                <div className="text-center p-4">
                  <Upload className="mx-auto text-gray-300 mb-2" size={32} />
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Logo Feltöltés</span>
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
            <div className="flex-1 space-y-3">
              <h4 className="font-bold text-gray-800">Műhely Logó</h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                A feltöltött logó automatikusan megjelenik minden **PDF jegyzőkönyv** fejlécében és a **QR kódos matricák** közepén.
              </p>
              <p className="text-xs text-blue-600 font-bold italic">Tipp: Használj átlátszó hátterű PNG fájlt!</p>
            </div>
          </div>
        </div>

        {/* Representative Signature */}
        <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
            <PenTool className="text-blue-600" /> Szerviz Képviselő Aláírása
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Ez az aláírás fog megjelenni minden jegyzőkönyvön és nyilatkozaton a szerviz oldalon. Elég egyszer rögzíteni.
          </p>

          <div className="space-y-6">
            <div className="relative h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden">
              {settings.representativeSignature ? (
                <div className="absolute inset-0 flex items-center justify-center p-4 bg-white group">
                  <img 
                    src={settings.representativeSignature} 
                    alt="Signature" 
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      onClick={() => updateRepresentativeSignature(null)}
                      className="bg-red-600 text-white p-3 rounded-xl shadow-lg hover:bg-red-700 transition"
                      title="Aláírás törlése"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <SignaturePad
                    ref={sigPad}
                    canvasProps={{
                      className: "w-full h-full cursor-crosshair"
                    }}
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Húzd ide az aláírást</p>
                  </div>
                </>
              )}
            </div>

            {!settings.representativeSignature && (
              <div className="flex gap-4">
                <button
                  onClick={() => sigPad.current?.clear()}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  <Eraser size={18} /> Törlés
                </button>
                <button
                  onClick={() => {
                    const data = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');
                    if (data) startTransition(() => updateRepresentativeSignature(data));
                  }}
                  className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
                >
                  <Check size={18} /> Aláírás Mentése
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Data & Storage Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          {/* Backup & Restore Management (Upgraded) */}
          <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Database className="text-emerald-600" /> Biztonsági Mentés és Visszaállítás
            </h2>
            
            {/* Backup Health Indicator */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              settings.backupStatus === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
              settings.backupStatus === 'failed' ? 'bg-rose-50 border-rose-100 text-rose-800' :
              'bg-gray-50 border-gray-100 text-gray-600'
            }`}>
              <div className="mt-0.5">
                {settings.backupStatus === 'success' ? <Check size={20} className="text-emerald-600 font-extrabold" /> :
                 settings.backupStatus === 'failed' ? <ShieldAlert size={20} className="text-rose-600" /> :
                 <Database size={20} className="text-gray-400" />}
              </div>
              <div>
                <h4 className="font-bold text-sm">Biztonsági mentés állapota</h4>
                <p className="text-xs mt-0.5 opacity-90">
                  {settings.backupStatus === 'success' ? 'A legutóbbi mentés sikeresen lefutott.' :
                   settings.backupStatus === 'failed' ? `Mentés sikertelen: ${settings.backupError || 'Ismeretlen hiba'}` :
                   'Nincs rögzített mentési esemény.'}
                </p>
                <p className="text-[10px] mt-1 opacity-75 font-semibold">
                  Utolsó mentés: {settings.lastBackupTime ? new Date(settings.lastBackupTime).toLocaleString('hu-HU') : 'Soha'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  startTransition(async () => {
                    try {
                      await triggerManualBackup();
                      alert('Biztonsági mentés sikeresen elkészült a szerveren!');
                    } catch (err: any) {
                      alert(err.message || 'Hiba történt a mentés futtatása közben.');
                    }
                  });
                }}
                disabled={isPending}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={isPending ? 'animate-spin' : ''} size={16} /> Mentés Most
              </button>

              <a
                href="/api/backup"
                className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition shadow-sm"
              >
                <Upload size={16} className="rotate-180" /> Letöltés (.zip)
              </a>
            </div>

            {/* Restore Screen */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h4 className="text-sm font-bold text-gray-800">Rendszer Visszaállítása mentésből</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Válassz ki egy korábban letöltött biztonsági mentés ZIP fájlt a rendszer, képek és adatbázis visszaállításához.
              </p>
              
              <form action={async (fd) => {
                const file = fd.get('backupFile') as File;
                if (!file || file.size === 0) {
                  alert('Válassz ki egy mentési ZIP fájlt!');
                  return;
                }
                if (!confirm('Figyelem: A visszaállítás felülírja a jelenlegi adatbázist és a feltöltött képeket! Biztosan folytatja?')) {
                  return;
                }
                startTransition(async () => {
                  try {
                    await triggerRestoreBackup(fd);
                    alert('A rendszer sikeresen visszaállításra került! A lap újratöltődik.');
                    window.location.reload();
                  } catch (err: any) {
                    alert(`Hiba történt a visszaállítás során: ${err.message || 'Ismeretlen hiba'}`);
                  }
                });
              }} className="space-y-3">
                <input
                  name="backupFile"
                  type="file"
                  accept=".zip"
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer cursor-pointer border border-dashed border-gray-300 p-2.5 rounded-xl bg-gray-50"
                  required
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-red-50 text-red-600 py-3 rounded-xl text-sm font-bold hover:bg-red-100 transition border border-red-100 disabled:opacity-50"
                >
                  Rendszer Helyreállítása
                </button>
              </form>
            </div>
          </div>

          {/* Storage Usage */}
          <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <HardDrive className="text-blue-600" /> Tárhely Használat
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-gray-500 uppercase tracking-tighter">Médiatár Mérete</span>
                <span className="text-blue-600">{storage.sizeFormatted}</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min((storage.sizeBytes / (100 * 1024 * 1024)) * 100, 100)}%` }} // 100MB is the "visual" max for the bar
                />
              </div>
              <p className="text-[10px] text-gray-400 font-medium italic text-right">Összesen {storage.totalJobs} munkalap fotói és PDF-jei.</p>
            </div>
            
            <button
              onClick={onCleanup}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition border border-red-100 disabled:opacity-50"
            >
              {isPending ? <RefreshCw className="animate-spin" size={18} /> : <Trash2 size={18} />}
              Old fotók törlése (30 nap+)
            </button>
            {cleanupResult !== null && (
              <p className="text-xs text-center text-red-600 font-bold animate-bounce">
                Sikeres törlés! {cleanupResult} munkalap felszabadítva.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
