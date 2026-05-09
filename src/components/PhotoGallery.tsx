'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Download, MessageSquare, Save } from 'lucide-react';
import { updatePhotoDescription } from '@/lib/actions';
import DeletePhoto from './DeletePhoto';

interface Photo {
  id: string;
  filePath: string;
  description: string | null;
  workOrderId: string;
  createdAt: Date | string;
}

export default function PhotoGallery({ photos, workOrderId }: { photos: Photo[], workOrderId: string }) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openLightbox = (photo: Photo) => {
    setSelectedPhoto(photo);
    setDescription(photo.description || '');
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
    setIsSaving(false);
  };

  const handleSaveDescription = async () => {
    if (!selectedPhoto) return;
    setIsSaving(true);
    try {
      await updatePhotoDescription(selectedPhoto.id, description, workOrderId);
      setSelectedPhoto({ ...selectedPhoto, description });
    } catch (error) {
      console.error('Failed to update description:', error);
      alert('Hiba történt a leírás mentésekor.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {photos.map((photo) => {
          const timestamp = new Date(photo.createdAt).getTime();
          // Use /api/media proxy to bypass Next.js stale file cache
          const proxyPath = `/api/media${photo.filePath}`;
          const cacheBustedSrc = `${proxyPath}?t=${timestamp}`;
          
          return (
            <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden border shadow-sm group cursor-pointer bg-gray-100">
              <Image 
                src={cacheBustedSrc} 
                alt="Device photo" 
                fill 
                unoptimized
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 200px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onClick={() => openLightbox(photo)}
              />
              
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-2 truncate opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-medium">
                {photo.description || 'Nincs leírás'}
              </div>

              {/* Action Buttons */}
              <DeletePhoto photoId={photo.id} workOrderId={workOrderId} />
              
              <a 
                href={proxyPath} 
                download={photo.filePath.split('/').pop()}
                className="absolute top-1 right-1 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-md text-gray-700 hover:text-blue-600 transition-opacity opacity-0 group-hover:opacity-100 z-10"
                title="Kép letöltése"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={14} />
              </a>
            </div>
          );
        })}
        {photos.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed rounded-3xl bg-gray-50/50">
            Még nincsenek fotók feltöltve.
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200 cursor-zoom-out"
          onClick={closeLightbox}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-6 right-6 text-white hover:text-gray-300 z-[110] bg-black/40 p-3 rounded-full cursor-pointer transition-colors"
          >
            <X size={32} />
          </button>

          <div 
            className="max-w-6xl w-full flex flex-col md:flex-row gap-6 h-full max-h-[90vh] cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex-1 bg-black rounded-2xl overflow-hidden shadow-2xl min-h-[50vh] flex items-center justify-center border border-white/10">
              <Image 
                src={`/api/media${selectedPhoto.filePath}?t=${new Date(selectedPhoto.createdAt).getTime()}`} 
                alt="Full size" 
                fill 
                unoptimized
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-contain"
                priority
              />
            </div>

            <div className="w-full md:w-96 bg-white rounded-3xl p-8 flex flex-col shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                  <MessageSquare size={24} className="text-blue-600" /> Megjegyzés
                </h3>
              </div>
              
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Írj egy részletes műszaki megjegyzést a fotóhoz..."
                className="flex-1 w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-700 leading-relaxed text-sm bg-gray-50 mb-6 shadow-inner"
              />

              <div className="space-y-4">
                <button
                  onClick={handleSaveDescription}
                  disabled={isSaving}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                  {isSaving ? 'Mentés...' : <><Save size={20} /> Leírás Mentése</>}
                </button>

                <a 
                  href={`/api/media${selectedPhoto.filePath}`} 
                  download 
                  className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-gray-500 hover:text-blue-600 transition bg-gray-50 rounded-xl hover:bg-blue-50"
                >
                  <Download size={18} /> Eredeti Kép Letöltése
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
