'use client';

/**
 * ============================================================================
 *  خدمات — صفحة تسجيل الدخول (/login)
 * ============================================================================
 *  - نموذج تسجيل دخول بسيط يستدعي Server Action (loginUser).
 *  - التحقق من المدخلات عبر zod داخل الإجراء.
 *  - عرض أخطاء الحقول + حالة الإرسال (isPending).
 *  - التوجيه بعد النجاح إلى /dashboard أو الصفحة المطلوبة.
 * ============================================================================
 */

import { Link } from '@/i18n/navigation';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';

import { loginUser } from '@/app/actions/auth';
import type { AuthActionState } from '@/lib/auth';

const INITIAL_STATE: AuthActionState = { success: false };

export default function LoginPage() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (_previous: AuthActionState, formData: FormData) =>
      loginUser(formData),
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.success && state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state, router]);

  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#f0f7fc] via-white to-[#e0f2fe] px-4 py-12">
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#2386c8]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#2386c8]/5 blur-3xl" />
      <div className="relative w-full max-w-lg">
        {/* الشعار */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2386c8] to-[#1a6da8] shadow-lg shadow-[#2386c8]/25">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7 12 3 4 7v10l8 4 8-4V7Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 4 8-4M12 21V11" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#222]">خدمات</h1>
          <p className="mt-2 text-sm text-[#666]">منصة العمل الحر العربية — سجّل الدخول لمتابعة أعمالك</p>
        </div>

        {/* البطاقة */}
        <section className="rounded-2xl border border-[#2386c8]/15 bg-white p-8 shadow-2xl shadow-[#2386c8]/10">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            تسجيل الدخول
          </h2>

          {state.message && !state.success ? (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {state.message}
            </div>
          ) : null}

          <form action={formAction} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                dir="ltr"
                placeholder="you@example.com"
                className={`w-full rounded-lg border px-4 py-2.5 text-left text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 ${
                  emailError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-[#2386c8]/20 focus:border-[#2386c8] focus:ring-[#2386c8]/20'
                }`}
              />
              {emailError ? (
                <p className="mt-1.5 text-sm text-red-600">{emailError}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                كلمة المرور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={`w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 ${
                  passwordError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-[#2386c8]/20 focus:border-[#2386c8] focus:ring-[#2386c8]/20'
                }`}
              />
              {passwordError ? (
                <p className="mt-1.5 text-sm text-red-600">{passwordError}</p>
              ) : null}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#444]">
                <input
                  type="checkbox"
                  name="remember"
                  className="h-4 w-4 rounded border-gray-300 text-[#2386c8] focus:ring-[#2386c8]"
                />
                تذكرني
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#2386c8] hover:text-[#1a6da8] hover:underline"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-[#2386c8] px-4 py-3 font-bold text-white shadow-md shadow-[#2386c8]/20 transition hover:bg-[#1a6da8] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-6">
            <p className="text-center text-sm text-[#666]">
              ليس لديك حساب؟{' '}
              <Link href="/register" className="font-bold text-[#2386c8] hover:text-[#1a6da8] hover:underline">
                أنشئ حساباً جديداً
              </Link>
            </p>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-gray-400">
          بالمتابعة أنت توافق على شروط الاستخدام وسياسة الخصوصية
        </p>
      </div>
    </main>
  );
}
