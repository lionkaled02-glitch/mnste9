'use client';

/**
 * ============================================================================
 *  mnste9 — صفحة تسجيل الدخول (/login)
 * ============================================================================
 *  نموذج دخول بالبريد وكلمة المرور عبر Server Action (loginUser) مع:
 *   - عرض أخطاء التحقق لكل حقل + رسالة خطأ عامة.
 *   - حالة انتظار أثناء التنفيذ (isPending).
 *   - توجيه تلقائي بعد النجاح إلى المسار المحجوز (?from=) أو /dashboard.
 * ============================================================================
 */

import Link from 'next/link';
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-emerald-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* الشعار */}
        <div className="mb-8 text-center">
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
            mnste9
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            منصة العمل الحر العربية — سجّل الدخول لمتابعة أعمالك
          </p>
        </div>

        {/* البطاقة */}
        <section className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-xl shadow-emerald-100/60">
          <h2 className="mb-6 text-xl font-bold text-gray-900">تسجيل الدخول</h2>

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
                    : 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-100'
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
                    : 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-100'
                }`}
              />
              {passwordError ? (
                <p className="mt-1.5 text-sm text-red-600">{passwordError}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            لا تملك حساباً؟{' '}
            <Link
              href="/register"
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
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
