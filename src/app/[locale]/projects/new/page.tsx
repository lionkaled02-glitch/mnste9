/**
 * خدمات — صفحة نشر مشروع جديد (/projects/new) — نظام موحد + #2386c8
 */

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ProjectForm } from '../project-form';

export const metadata: Metadata = {
  title: 'انشر مشروعك الجديد | خدمات',
};

export default async function NewProjectPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 text-center">
          <p className="text-lg font-bold text-slate-800">سجّل دخولك لنشر مشروع</p>
          <Link href="/login?from=/projects/new" className="mt-6 inline-block rounded-lg bg-[#2386c8] px-8 py-3 text-sm font-semibold text-white hover:bg-[#1a6da8]">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">انشر مشروعك الجديد</h1>
        <ProjectForm />
      </div>
    </div>
  );
}
