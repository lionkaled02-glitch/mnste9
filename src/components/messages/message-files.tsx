'use client';

import { useTranslations } from 'next-intl';

import { DownloadButton } from '@/components/contracts/download-button';
import { extractFilesFromMessage } from '@/lib/utils/message-files';

export function MessageFiles({ content }: { content: string }) {
  const t = useTranslations('messages');
  const files = extractFilesFromMessage(content);

  if (files.length === 0) return null;

  return (
    <div className="mt-2 space-y-2 border-t border-slate-200 pt-2">
      <p className="text-xs font-bold text-slate-600">
        {t('attachedFiles')}
      </p>
      {files.map((file, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2"
        >
          <span className="truncate text-xs" title={file.name}>
            {file.name}
          </span>
          <DownloadButton fileKey={file.key} fileName={file.name} />
        </div>
      ))}
    </div>
  );
}
