'use client';

/**
 * ============================================================================
 *  خدمات — زر «نسخ الرابط» (Client Component)
 * ============================================================================
 *  يُستخدم من صفحات السيرفر (مثل /projects/[id]) بدل تمرير onClick مباشرة —
 *  معالجات الأحداث لا يمكن تمريرها من Server Component
 *  ("Event handlers cannot be passed to Client Component props").
 *  - ينسخ الرابط الحالي (أو url المُمرَّر) إلى الحافظة ويعرض تأكيداً مؤقتاً.
 *  - يتراجع إلى execCommand('copy') في المتصفحات بلا Clipboard API.
 * ============================================================================
 */

import { useEffect, useRef, useState } from 'react';

interface CopyLinkButtonProps {
  /** الرابط المراد نسخه — افتراضياً رابط الصفحة الحالية */
  url?: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // نجرّب الطريقة القديمة أدناه
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function CopyLinkButton({
  url,
  label = 'نسخ الرابط',
  copiedLabel = 'تم النسخ ✓',
  className = 'flex-1 rounded-[8px] bg-[#f4f5f7] border border-gray-200 px-3 py-2 text-[11px] font-bold text-[#444] hover:bg-white',
}: CopyLinkButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleClick = async () => {
    const target = url ?? window.location.href;
    const ok = await copyText(target);
    setStatus(ok ? 'copied' : 'failed');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus('idle'), 2000);
  };

  return (
    <button type="button" onClick={handleClick} className={className} aria-live="polite">
      {status === 'copied' ? copiedLabel : status === 'failed' ? 'تعذّر النسخ' : label}
    </button>
  );
}
