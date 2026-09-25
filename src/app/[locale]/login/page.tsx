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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#f8fafc] via-white to-[#e0f2fe] px-4 py-12">
      <div className="w-full max-w-md">
        {/* الشعار */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2386c8] shadow-lg shadow-[#2386c8]/20">
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
            خدمات
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            منصة العمل الحر العربية — سجّل الدخول لمتابعة أعمالك
          </p>
        </div>

        {/* البطاقة */}
        <section className="rounded-2xl border border-[#2386c8]/20 bg-white p-8 shadow-xl shadow-[#2386c8]/10">
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

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-[#2386c8] px-4 py-3 font-semibold text-white transition hover:bg-[#1a6da8] focus:outline-none focus:ring-2 focus:ring-[#2386c8] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ليس لديك حساب؟{' '}
            <Link
              href="/register"
              className="font-semibold text-[#2386c8] hover:text-[#1a6da8] hover:underline"
            >
              أنشئ حساباً جديداً
            </Link>
          </p>
        </section>

        <p className="mt-8 text-center text-xs text-gray-400">
          بالمتابعة أنت توافق على شروط الاستخدام وسياسة الخصوصية
        </p>
      </div>
    </main>
  );
}