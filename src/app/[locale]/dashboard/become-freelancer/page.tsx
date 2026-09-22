'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { becomeFreelancerAction } from '@/app/actions/become-freelancer';
import type { AuthActionState } from '@/lib/auth';

const INITIAL_STATE: AuthActionState = { success: false };

export default function BecomeFreelancerPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(becomeFreelancerAction, INITIAL_STATE);

  useEffect(() => {
    if (state.success && state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#222]">أصبح مستقلاً</h1>
        <p className="mt-2 text-sm leading-6 text-[#666]">
          كصاحب عمل يمكنك الترقية إلى مستقل لتقديم العروض على المشاريع. ستحتاج إلى توثيق هويتك (KYC) قبل أي عمل كمستقل.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-[15px] font-bold text-[#222]">ماذا ستحصل عليه؟</h2>
        <ul className="mt-4 space-y-2 text-sm text-[#444]">
          <li>✓ تصفح جميع المشاريع المنشورة</li>
          <li>✓ تقديم عروض غير محدودة</li>
          <li>✓ بناء معرض أعمال وسمعة</li>
          <li>✓ سحب الأرباح عبر الكريمي أو PayPal</li>
        </ul>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold text-amber-800">تنبيه KYC</p>
          <p className="mt-1 text-xs leading-5 text-amber-700">
            بعد الترقية ستحتاج إلى رفع وثائق توثيق الهوية قبل تقديم أي عرض أو سحب. صاحب العمل لا يحتاج KYC.
          </p>
        </div>

        {state.message && (
          <p className={`mt-6 rounded-lg border px-4 py-3 text-sm ${state.success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {state.message}
          </p>
        )}

        <form action={formAction} className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-[#2386c8] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1a6da8] disabled:opacity-60"
          >
            {isPending ? 'جارٍ الترقية…' : 'ترقية الآن إلى مستقل'}
          </button>
          <Link href="/dashboard" className="rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-[#444] hover:border-[#222] hover:text-[#222]">
            العودة للوحة التحكم
          </Link>
        </form>
      </div>
    </div>
  );
}
