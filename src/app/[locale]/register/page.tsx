'use client';

/**
 * ============================================================================
 *  mnste9 — صفحة إنشاء الحساب (/register)
 * ============================================================================
 *  نموذج تسجيل (الاسم، البريد، كلمة المرور وتأكيدها) عبر Server Action
 *  (registerUser) مع:
 *   - فحص تطابق كلمتي المرور في العميل قبل الإرسال.
 *   - عرض أخطاء zod لكل حقل + رسالة عامة.
 *   - توجيه تلقائي بعد النجاح إلى /select-account-type.
 * ============================================================================
 */

import { Link } from '@/i18n/navigation';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';

import { registerUser } from '@/app/actions/auth';
import type { AuthActionState } from '@/lib/auth';

const INITIAL_STATE: AuthActionState = { success: false };

/** غلاف الإجراء: فحص تطابق كلمتي المرور قبل الاستدعاء */
async function registerAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (password !== confirmPassword) {
    return {
      success: false,
      fieldErrors: { confirmPassword: ['كلمتا المرور غير متطابقتين'] },
    };
  }

  return registerUser(formData);
}

export default function RegisterPage() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    registerAction,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.success && state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state, router]);

  const nameError = state.fieldErrors?.name?.[0];
  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];
  const confirmPasswordError = state.fieldErrors?.confirmPassword?.[0];

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
            أنشئ حسابك وابدأ رحلتك في العمل الحر
          </p>
        </div>

        {/* البطاقة */}
        <section className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-xl shadow-emerald-100/60">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            إنشاء حساب جديد
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
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                الاسم الكامل
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="مثال: أحمد محمد"
                className={`w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 ${
                  nameError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-100'
                }`}
              />
              {nameError ? (
                <p className="mt-1.5 text-sm text-red-600">{nameError}</p>
              ) : null}
            </div>

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
                autoComplete="new-password"
                minLength={8}
                placeholder="8 أحرف على الأقل"
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

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                تأكيد كلمة المرور
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                placeholder="أعد كتابة كلمة المرور"
                className={`w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 ${
                  confirmPasswordError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-100'
                }`}
              />
              {confirmPasswordError ? (
                <p className="mt-1.5 text-sm text-red-600">
                  {confirmPasswordError}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'جارٍ إنشاء الحساب…' : 'إنشاء الحساب'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            لديك حساب بالفعل؟{' '}
            <Link
              href="/login"
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              سجّل الدخول
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
