'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Download, MessageSquare, Save } from 'lucide-react';
import { updatePhotoDescription } from '@/lib/actions';

interface Photo {
  id: string;
  filePath: string;
  description: string | null;
  workOrderId: string;
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
      // Update local state to reflect change without full reload if possible, 
      // but revalidatePath will handle the server side.
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border shadow-sm group cursor-pointer">
            <Image 
              src={photo.filePath} 
              alt="Device photo" 
              fill 
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 200px"
              className="object-cover"
              onClick={() => openLightbox(photo)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {photo.description || 'Nincs leírás'}
            </div>
            <a 
              href={photo.filePath} 
              download={photo.filePath.split('/').pop()}
              className="absolute top-1 right-1 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-md text-gray-700 hover:text-blue-600 transition-opacity opacity-0 group-hover:opacity-100 z-10"
              title="Kép letöltése"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={16} />
            </a>
          </div>
        ))}
        {photos.length === 0 && (
          <div className="col-span-full py-8 text-center text-gray-400 border-2 border-dashed rounded-lg">
            Még nincsenek fotók.
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200 cursor-zoom-out"
          onClick={closeLightbox}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 bg-black/20 p-2 rounded-full cursor-pointer"
          >
            <X size={32} />
          </button>

          <div 
            className="max-w-5xl w-full flex flex-col md:flex-row gap-6 h-full max-h-[90vh] cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex-1 bg-black rounded-xl overflow-hidden shadow-2xl min-h-[50vh]">
              <Image 
                src={selectedPhoto.filePath} 
                alt="Full size" 
                fill 
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-contain"
                priority
              />
            </div>

            <div className="w-full md:w-80 bg-white rounded-xl p-6 flex flex-col shadow-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                <MessageSquare size={20} className="text-blue-600" /> Megjegyzés
              </h3>
              
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Írj egy megjegyzést a fotóhoz..."
                className="flex-1 w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-gray-700 text-sm mb-4 bg-gray-50"
              />

              <button
                onClick={handleSaveDescription}
                disabled={isSaving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSaving ? 'Mentés...' : <><Save size={18} /> Mentés</>}
              </button>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <a 
                  href={selectedPhoto.filePath} 
                  download 
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition"
                >
                  <Download size={16} /> Teljes felbontású kép letöltése
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
