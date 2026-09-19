'use client';

/**
 * ============================================================================
 *  mnste9 — صفحة اختيار نوع الحساب (/select-account-type)
 * ============================================================================
 *  تُعرض بعد التسجيل مباشرة: بطاقتان — "أنا صاحب عمل" (client) لإنشاء
 *  المشاريع، و"أنا مستقل" (freelancer) لتقديم العروض.
 *  الاختيار يستدعي selectAccountType (Server Action) الذي يحدّث الدور،
 *  ثم التوجيه إلى /dashboard.
 * ============================================================================
 */

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';

import { selectAccountType } from '@/app/actions/auth';
import type { AuthActionState } from '@/lib/auth';

const INITIAL_STATE: AuthActionState = { success: false };

export default function SelectAccountTypePage() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (_previous: AuthActionState, formData: FormData) =>
      selectAccountType(formData),
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.success && state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-emerald-100 px-4 py-12">
      <div className="w-full max-w-3xl">
        {/* الرأس */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-200">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7 12 3 4 7v10l8 4 8-4V7Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4 7 8 4 8-4M12 21V11"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            كيف ستستخدم mnste9؟
          </h1>
          <p className="mt-3 text-gray-500">
            اختر نوع حسابك — يمكنك التبديل بين النوعين في أي وقت لاحقاً من
            إعدادات الحساب
          </p>
        </div>

        {state.message && !state.success ? (
          <div
            role="alert"
            className="mx-auto mb-8 max-w-xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700"
          >
            {state.message}
          </div>
        ) : null}

        {/* البطاقتان */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* صاحب عمل */}
          <form action={formAction}>
            <input type="hidden" name="accountType" value="client" />
            <button
              type="submit"
              disabled={isPending}
              className="group flex h-full w-full flex-col items-center rounded-2xl border-2 border-emerald-100 bg-white p-8 text-center shadow-lg shadow-emerald-100/50 transition hover:border-emerald-500 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.893m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </span>
              <span className="text-xl font-bold text-gray-900">
                أنا صاحب عمل
              </span>
              <span className="mt-3 text-sm leading-6 text-gray-500">
                أنشر مشاريعي، استلم عروض المستقلين، وادفع بأمان عبر نظام
                الضمان المالي
              </span>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">
                متابعة كصاحب عمل
                <svg
                  className="h-4 w-4 rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
            </button>
          </form>

          {/* مستقل */}
          <form action={formAction}>
            <input type="hidden" name="accountType" value="freelancer" />
            <button
              type="submit"
              disabled={isPending}
              className="group flex h-full w-full flex-col items-center rounded-2xl border-2 border-emerald-100 bg-white p-8 text-center shadow-lg shadow-emerald-100/50 transition hover:border-emerald-500 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </span>
              <span className="text-xl font-bold text-gray-900">أنا مستقل</span>
              <span className="mt-3 text-sm leading-6 text-gray-500">
                قدّم عروضك على المشاريع، نفّذ الأعمال، واستلم أرباحك في
                محفظتك
              </span>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">
                متابعة كمستقل
                <svg
                  className="h-4 w-4 rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
            </button>
          </form>
        </div>

        <p className="mt-10 text-center text-xs text-gray-400">
          {isPending ? 'جارٍ تفعيل حسابك…' : 'اخترت بالفعل؟ يمكنك تغيير النوع لاحقاً من الإعدادات'}
        </p>
      </div>
    </main>
  );
}
