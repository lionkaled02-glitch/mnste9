/**
 * ============================================================================
 *  mnste9 — صفحة نشر مشروع جديد (/projects/new) — المرحلة 10 محسّنة
 * ============================================================================
 *  - يستخدم SiteHeader/Footer
 *  - توسيع الحاوية إلى max-w-6xl لاستيعاب شبكة النموذج + الشريط الجانبي
 *  - ProjectForm محسّن (قوالب، ضمانات، نصائح، مسودة)
 * ============================================================================
 */

import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getCurrentUser } from '@/lib/auth';

import { ProjectForm } from '../project-form';

export const metadata: Metadata = {
  title: 'انشر مشروعك الجديد',
};

export default async function NewProjectPage() {
  const currentUser = await getCurrentUser();
  const isClient = currentUser?.role === 'client';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">انشر مشروعك الجديد</h1>

        {isClient ? (
          <ProjectForm />
        ) : (
          <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <svg
                className="h-7 w-7 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </span>

            <p className="mt-5 text-lg font-bold text-slate-800">هذه الصفحة لصاحب العمل فقط</p>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              نشر المشاريع متاح لحسابات أصحاب العمل — يمكنك اختيار نوع حسابك كصاحب عمل خلال ثوانٍ.
            </p>

            <Link
              href="/select-account-type"
              className="mt-6 inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              اختر نوع الحساب
            </Link>

            {!currentUser && (
              <p className="mt-5 text-sm text-slate-500">
                لديك حساب بالفعل؟{' '}
                <Link href="/login?from=/projects/new" className="font-semibold text-emerald-700 hover:underline">
                  سجّل الدخول أولاً
                </Link>
              </p>
            )}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
