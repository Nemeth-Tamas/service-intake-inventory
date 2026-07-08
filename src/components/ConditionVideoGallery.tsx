'use client';

import { useState } from 'react';
import { deleteConditionVideo } from '@/lib/actions';
import { Copy, Check, Trash2, Download, Play, X, FileVideo } from 'lucide-react';
import Image from 'next/image';

interface ConditionVideoType {
  id: string;
  filePath: string;
  thumbnailPath: string | null;
  originalFileName: string | null;
  durationSeconds: number | null;
  sizeBytes: number | null;
  codec: string | null;
  width: number | null;
  height: number | null;
  sha256: string | null;
  thumbnailSha256: string | null;
  createdAt: Date | string;
}

export default function ConditionVideoGallery({
  videos,
  workOrderId,
}: {
  videos: ConditionVideoType[];
  workOrderId: string;
}) {
  const [selectedVideo, setSelectedVideo] = useState<ConditionVideoType | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCopyHash = async (id: string, hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy hash:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Biztosan törölni akarja ezt az állapotvideót? Ez a művelet nem vonható vissza.')) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteConditionVideo(id, workOrderId);
    } catch (err) {
      console.error('Failed to delete video:', err);
      alert('Nem sikerült törölni a videót.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {videos.map((video) => {
          const timestamp = new Date(video.createdAt).getTime();
          const videoProxyPath = `/api/media${video.filePath}`;
          const thumbnailProxyPath = video.thumbnailPath
            ? `/api/media${video.thumbnailPath}?t=${timestamp}`
            : null;
          const shortHash = video.sha256 ? `${video.sha256.slice(0, 16)}...` : 'N/A';

          return (
            <div
              key={video.id}
              className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden flex flex-col group relative shadow-sm hover:shadow-md transition duration-200"
            >
              {/* Thumbnail Area with Play Button */}
              <div
                className="relative aspect-video bg-black cursor-pointer flex items-center justify-center overflow-hidden"
                onClick={() => setSelectedVideo(video)}
              >
                {thumbnailProxyPath ? (
                  <Image
                    src={thumbnailProxyPath}
                    alt="Videó indexkép"
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-102 transition duration-200"
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <FileVideo size={40} />
                    <span className="text-xs mt-1">Nincs indexkép</span>
                  </div>
                )}
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-80 group-hover:opacity-100 transition duration-200">
                  <div className="w-12 h-12 rounded-full bg-white/90 shadow-md flex items-center justify-center text-indigo-600 hover:scale-110 transition duration-150">
                    <Play size={20} fill="currentColor" className="ml-1" />
                  </div>
                </div>

                {/* Duration Badge */}
                {video.durationSeconds !== null && (
                  <div className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-black px-2 py-0.5 rounded">
                    {video.durationSeconds} mp
                  </div>
                )}
              </div>

              {/* Metadata Area */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rögzítve</p>
                  <p className="text-xs font-semibold text-gray-700">
                    {new Date(video.createdAt).toLocaleString('hu-HU')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500">
                  <div>
                    <span className="font-bold text-gray-400">Méret:</span> {formatSize(video.sizeBytes)}
                  </div>
                  <div>
                    <span className="font-bold text-gray-400">Felbontás:</span>{' '}
                    {video.width && video.height ? `${video.width}x${video.height}` : 'N/A'}
                  </div>
                </div>

                {/* SHA-256 Area */}
                {video.sha256 && (
                  <div className="bg-white border border-gray-100 rounded-lg p-2 flex items-center justify-between text-[10px] font-mono text-gray-600">
                    <span className="truncate" title={video.sha256}>
                      SHA-256: {shortHash}
                    </span>
                    <button
                      onClick={() => handleCopyHash(video.id, video.sha256 || '')}
                      className="text-gray-400 hover:text-indigo-600 transition"
                      title="SHA-256 másolása"
                    >
                      {copiedId === video.id ? (
                        <Check size={12} className="text-emerald-500 font-bold" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <a
                    href={`${videoProxyPath}?download=true`}
                    download={video.originalFileName || 'video.mp4'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 transition"
                  >
                    <Download size={12} /> Letöltés
                  </a>
                  <button
                    onClick={() => handleDelete(video.id)}
                    disabled={deletingId === video.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 border border-red-100 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition disabled:opacity-50"
                  >
                    <Trash2 size={12} /> Törlés
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {videos.length === 0 && (
          <div className="col-span-full py-8 text-center text-gray-400 border-2 border-dashed rounded-3xl bg-gray-50/50 text-sm">
            Még nincsenek állapotvideók rögzítve.
          </div>
        )}
      </div>

      {/* Lightbox / Video Player Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedVideo(null)}
        >
          <button
            onClick={() => setSelectedVideo(null)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 z-[110] bg-black/40 p-3 rounded-full cursor-pointer transition"
          >
            <X size={32} />
          </button>

          <div
            className="max-w-4xl w-full max-h-[85vh] aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={`/api/media${selectedVideo.filePath}`}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
