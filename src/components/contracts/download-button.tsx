'use client';

import { useState } from 'react';

export function DownloadButton({
  fileKey,
  fileName,
}: {
  fileKey: string;
  fileName: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const normalizedKey = fileKey.startsWith('b2:') ? fileKey.slice(3) : fileKey;
      const encodedKey = normalizedKey.split('/').map(encodeURIComponent).join('/');
      const res = await fetch(
        `/api/download/${encodedKey}?name=${encodeURIComponent(fileName)}`,
      );
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg bg-[#2386c8] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
    >
      {loading ? 'جارٍ التحميل...' : 'تنزيل'}
    </button>
  );
}
