'use client';

import { useEffect } from 'react';

import { useRouter } from '@/i18n/navigation';

export function ApprovedRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center text-emerald-800" dir="rtl">
      تم اعتماد حسابك. جارٍ تحويلك إلى لوحة التحكم…
    </div>
  );
}
