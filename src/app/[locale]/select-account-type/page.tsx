'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { selectAccountTypeAction } from '@/app/actions/auth';
import type { AuthActionState } from '@/lib/auth';

const INITIAL_STATE: AuthActionState = { success: false };

export default function SelectAccountTypePage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    selectAccountTypeAction,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.success && state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#f8fafc] via-white to-[#e0f2fe] px-4 py-12" dir="rtl">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#222]">اختر نوع حسابك</h1>
          <p className="mt-2 text-sm text-[#666]">
            يمكنك الترقية لاحقاً في أي وقت من الإعدادات
          </p>
        </div>

        {state.message && !state.success && (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.message}
          </p>
        )}

        <form action={formAction} className="grid gap-6 sm:grid-cols-2">
          <button
            type="submit"
            name="accountType"
            value="client"
            disabled={isPending}
            className="group rounded-2xl border-2 border-gray-200 bg-white p-8 text-right shadow-sm transition hover:border-[#2386c8] hover:shadow-lg disabled:opacity-60"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#2386c8]/10 text-[#2386c8]">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.098c0 1.036-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V14.15M15 8.625h4.5A1.875 1.875 0 0 1 21.375 10.5v3.675a1.875 1.875 0 0 1-1.875 1.875H4.5a1.875 1.875 0 0 1-1.875-1.875V10.5A1.875 1.875 0 0 1 4.5 8.625h4.5m0 0V6.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v2.25M15 8.625H9" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#222] group-hover:text-[#2386c8]">
              أنا صاحب عمل
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#666]">
              أنشر المشاريع، أستقبل العروض، وأدفع للمستقلين.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-[#666]">
              <li>✓ نشر مشاريع غير محدودة</li>
              <li>✓ استقبال عروض</li>
              <li>✓ توثيق فوري</li>
            </ul>
          </button>

          <button
            type="submit"
            name="accountType"
            value="freelancer"
            disabled={isPending}
            className="group rounded-2xl border-2 border-gray-200 bg-white p-8 text-right shadow-sm transition hover:border-[#2386c8] hover:shadow-lg disabled:opacity-60"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#2386c8]/10 text-[#2386c8]">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#222] group-hover:text-[#2386c8]">
              أنا مستقل
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#666]">
              أقدم عروضاً على المشاريع، أنفذ، وأستلم الأرباح.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-[#666]">
              <li>✓ تصفح المشاريع</li>
              <li>✓ تقديم عروض غير محدودة</li>
              <li>✓ إعداد حساب خطوة بخطوة</li>
              <li>⚠️ يتطلب توثيق الهوية (KYC)</li>
            </ul>
          </button>
        </form>
      </div>
    </main>
  );
}
