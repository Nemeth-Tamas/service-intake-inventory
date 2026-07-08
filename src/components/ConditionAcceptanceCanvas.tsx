'use client';

import { useRef, useState } from 'react';
import SignaturePad from 'react-signature-canvas';
import { Check, X, Eraser, Info, ShieldCheck, Tag, User, Camera, FileVideo, Play } from 'lucide-react';
import { saveConditionAcceptance } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import Image from 'next/image';

interface Photo {
  id: string;
  filePath: string;
  description: string | null;
}

interface ConditionVideo {
  id: string;
  filePath: string;
  thumbnailPath: string | null;
  durationSeconds: number | null;
}

interface Props {
  workOrder: {
    id: string;
    customerName: string | null;
    deviceType: string | null;
    serialNumber: string | null;
    condition: string | null;
    accessories: string | null;
    photos: Photo[];
    conditionVideos: ConditionVideo[];
  };
  acceptanceText: string;
}

export default function ConditionAcceptanceCanvas({ workOrder, acceptanceText }: Props) {
  const sigPad = useRef<SignaturePad>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVideoPath, setSelectedVideoPath] = useState<string | null>(null);
  const router = useRouter();

  const clear = () => {
    sigPad.current?.clear();
  };

  const save = async () => {
    if (sigPad.current?.isEmpty()) {
      alert('Kérjük, írja alá a dokumentumot az elfogadáshoz!');
      return;
    }

    setLoading(true);
    try {
      const data = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');
      if (data) {
        await saveConditionAcceptance(workOrder.id, data);
        // Redirect back to work order
        router.push(`/t/${workOrder.id}`);
      }
    } catch (error) {
      console.error('Failed to save condition acceptance:', error);
      alert('Hiba történt az aláírás mentése közben.');
    } finally {
      setLoading(false);
    }
  };

  const sanitizedAcceptanceText = DOMPurify.sanitize(acceptanceText, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: [],
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto flex-1 pb-12">
      {/* Left Column: Device Info & Media Review */}
      <div className="flex-1 space-y-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 border-b pb-3">
            <Info size={20} className="text-indigo-600" /> Készülék & Átvevő Adatok
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-3">
              <User className="text-gray-400 mt-0.5" size={20} />
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ügyfél neve</p>
                <p className="text-sm font-extrabold text-gray-800">{workOrder.customerName || 'Nincs megadva'}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-3">
              <Tag className="text-gray-400 mt-0.5" size={20} />
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Eszköz típusa / SN</p>
                <p className="text-sm font-extrabold text-gray-800">
                  {workOrder.deviceType || 'Ismeretlen'}
                  {workOrder.serialNumber && <span className="font-mono text-xs block text-gray-500 font-normal">S/N: {workOrder.serialNumber}</span>}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-2xl space-y-2">
            <p className="text-[10px] text-amber-800 font-black uppercase tracking-wider">Átvevőkori állapot leírása</p>
            <p className="text-sm font-semibold text-amber-950 leading-relaxed italic">
              {workOrder.condition || 'Nincs külön rögzített hiba/sérülés leírás.'}
            </p>
          </div>

          {workOrder.accessories && (
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Átvett tartozékok</p>
              <p className="text-sm font-bold text-gray-700">{workOrder.accessories}</p>
            </div>
          )}
        </div>

        {/* Media Review Section */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 border-b pb-3">
            <Camera size={20} className="text-indigo-600" /> Rögzített állapot dokumentáció
          </h2>

          <p className="text-xs text-gray-500 leading-normal">
            Kérjük, tekintse meg a készülékről készült alábbi fotókat és videókat, melyek az átvételkori állapotot hivatottak igazolni.
          </p>

          {/* Photos list */}
          {workOrder.photos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fotók</p>
              <div className="grid grid-cols-3 gap-3">
                {workOrder.photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden border bg-gray-50 group">
                    <Image
                      src={`/api/media${photo.filePath}`}
                      alt="Device condition photo"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    {photo.description && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] p-1 truncate">
                        {photo.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos list */}
          {workOrder.conditionVideos.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Videók</p>
              <div className="grid grid-cols-2 gap-3">
                {workOrder.conditionVideos.map((video) => {
                  const thumbnailProxy = video.thumbnailPath ? `/api/media${video.thumbnailPath}` : null;
                  return (
                    <div
                      key={video.id}
                      className="relative aspect-video rounded-xl overflow-hidden bg-black border cursor-pointer flex items-center justify-center group"
                      onClick={() => setSelectedVideoPath(video.filePath)}
                    >
                      {thumbnailProxy ? (
                        <Image
                          src={thumbnailProxy}
                          alt="Video thumbnail"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="text-gray-500 flex flex-col items-center">
                          <FileVideo size={32} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-indigo-600 shadow group-hover:scale-105 transition duration-150">
                          <Play size={16} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                      {video.durationSeconds !== null && (
                        <span className="absolute bottom-1 right-1 text-[9px] bg-black/75 text-white px-1.5 py-0.5 rounded font-bold">
                          {video.durationSeconds} mp
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {workOrder.photos.length === 0 && workOrder.conditionVideos.length === 0 && (
            <div className="py-6 text-center text-gray-400 text-sm border-2 border-dashed rounded-2xl bg-gray-50/50">
              Nincs feltöltött fotó vagy videó ehhez a munkalaphoz.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Signature Canvas & Declaration text */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-md flex-1 flex flex-col">
          <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6">
            <section className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              <h2 className="text-xl font-black text-gray-900 mb-4 border-b-2 border-indigo-500 pb-2 flex items-center gap-2">
                <ShieldCheck size={22} className="text-indigo-600" /> NYILATKOZAT
              </h2>
              
              <div className="space-y-4 text-[14px]">
                <div 
                  className="font-medium text-gray-800 bg-gray-50 p-5 rounded-2xl border border-gray-100 declaration-content max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: `
                      <style>
                        .declaration-content p { margin-bottom: 0.5rem !important; line-height: 1.5; min-height: 1em; }
                        .declaration-content p:empty::before { content: "\\00a0"; }
                        .declaration-content ul { list-style-type: disc !important; padding-left: 1.25rem !important; margin-top: 0.25rem !important; margin-bottom: 0.75rem !important; }
                        .declaration-content li { margin-bottom: 0.25rem !important; padding-left: 0.25rem; display: list-item !important; }
                        .declaration-content p:last-child, .declaration-content ul:last-child { margin-bottom: 0 !important; }
                        .declaration-content { word-break: break-word !important; overflow-wrap: break-word !important; }
                      </style>
                      ${sanitizedAcceptanceText.replace(/&nbsp;/g, ' ')}
                    `
                  }}
                />
              </div>
            </section>

            <div className="space-y-3 pt-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ügyfél aláírása</p>
                </div>
                <button 
                  onClick={clear}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 font-bold transition-colors text-xs bg-gray-50 px-3 py-1.5 rounded-lg border"
                >
                  <Eraser size={14} /> Törlés
                </button>
              </div>
              
              <div className="relative h-56 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <SignaturePad
                  ref={sigPad}
                  canvasProps={{
                    className: "w-full h-full cursor-crosshair"
                  }}
                />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Aláírás helye</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
            <button
              onClick={() => router.back()}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-600 px-4 py-3.5 rounded-2xl font-bold border border-gray-200 hover:bg-gray-100 transition shadow-sm text-sm"
            >
              <X size={18} /> Mégse
            </button>
            <button
              onClick={save}
              disabled={loading}
              className="flex-[2] flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3.5 rounded-2xl font-extrabold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Check size={18} strokeWidth={3} /> Elfogadom a rögzített állapotot és aláírom</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Video Lightbox Modal */}
      {selectedVideoPath && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedVideoPath(null)}
        >
          <button
            onClick={() => setSelectedVideoPath(null)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 z-[110] bg-black/40 p-3 rounded-full cursor-pointer transition"
          >
            <X size={32} />
          </button>

          <div
            className="max-w-4xl w-full max-h-[85vh] aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={`/api/media${selectedVideoPath}`}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
