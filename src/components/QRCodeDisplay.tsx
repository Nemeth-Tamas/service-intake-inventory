'use client'

import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeDisplay({ value }: { value: string }) {
  // 'value' already contains the absolute URL passed from the parent (tracking page)
  return (
    <div className="flex flex-col items-center gap-2 bg-white p-4 rounded-lg shadow-sm">
      <QRCodeSVG 
        value={value} 
        size={180} 
        level="H" 
        includeMargin={true}
      />
      <p className="text-[10px] text-gray-400 break-all text-center max-w-[200px] mt-1">{value}</p>
    </div>
  );
}
