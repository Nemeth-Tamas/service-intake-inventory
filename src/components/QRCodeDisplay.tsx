'use client'

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

export default function QRCodeDisplay({ value }: { value: string }) {
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const fullUrl = baseUrl ? `${baseUrl}${value}` : value;

  return (
    <div className="flex flex-col items-center gap-2 bg-white p-4 rounded-lg shadow-sm">
      <QRCodeSVG value={fullUrl} size={150} />
      <p className="text-xs text-gray-500 break-all text-center">{fullUrl}</p>
    </div>
  );
}
