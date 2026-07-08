'use client';

import Link from 'next/link';
import { PenTool, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Photo {
  id: string;
}

interface ConditionVideo {
  id: string;
}

interface WorkOrder {
  id: string;
  conditionAcceptedAt: Date | string | null;
  conditionAcceptanceMediaSnapshot: string | null;
  photos: Photo[];
  conditionVideos: ConditionVideo[];
}

export default function ConditionAcceptanceTrigger({
  workOrder,
}: {
  workOrder: WorkOrder;
}) {
  const isSigned = !!workOrder.conditionAcceptedAt;
  
  let mediaAddedAfterSigning = false;
  if (isSigned && workOrder.conditionAcceptanceMediaSnapshot) {
    try {
      const snapshot = JSON.parse(workOrder.conditionAcceptanceMediaSnapshot);
      const snapshotVideoIds = new Set((snapshot.videos || []).map((v: any) => v.id));
      const snapshotPhotoIds = new Set((snapshot.photos || []).map((p: any) => p.id));

      const currentVideoIds = workOrder.conditionVideos.map(v => v.id);
      const currentPhotoIds = workOrder.photos.map(p => p.id);

      const hasNewVideo = currentVideoIds.some(id => !snapshotVideoIds.has(id));
      const hasNewPhoto = currentPhotoIds.some(id => !snapshotPhotoIds.has(id));

      mediaAddedAfterSigning = hasNewVideo || hasNewPhoto;
    } catch (e) {
      console.error('Failed to parse media snapshot:', e);
    }
  }

  return (
    <div className="bg-white border p-6 rounded-2xl shadow-sm space-y-4">
      <h2 className="flex items-center gap-2 font-bold text-lg text-gray-800 border-b pb-3">
        <ShieldCheck size={20} className="text-indigo-500" /> Átvételi állapot elfogadása
      </h2>

      {isSigned ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
            <CheckCircle2 size={20} className="shrink-0" />
            <div>
              <p className="font-extrabold text-sm">Ügyfél által elfogadva</p>
              <p className="text-[10px] font-bold opacity-80">
                Aláírva: {new Date(workOrder.conditionAcceptedAt!).toLocaleString('hu-HU')}
              </p>
            </div>
          </div>

          {mediaAddedAfterSigning && (
            <div className="flex items-start gap-2.5 text-amber-800 bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs leading-normal">
              <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">Média változás észlelve</p>
                <p className="text-amber-700">
                  Figyelem: az aláírás óta új média került hozzáadásra. Az eredeti aláírt nyilatkozat csak az aláíráskor meglévő médiára vonatkozik.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider bg-gray-50 border border-gray-100 p-3.5 rounded-xl text-center">
            Még nincs ügyfél által elfogadva
          </div>

          <Link
            href={`/condition-acceptance/${workOrder.id}`}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 text-sm"
          >
            <PenTool size={16} />
            <span>Átvételi állapot elfogadtatása</span>
          </Link>
        </div>
      )}
    </div>
  );
}
