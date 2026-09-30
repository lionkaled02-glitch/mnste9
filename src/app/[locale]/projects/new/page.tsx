/**
 * خدمات — صفحة نشر مشروع جديد (/projects/new) — نظام موحد + #2386c8
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { getLatestKycDocument } from '@/app/actions/kyc';
import { db } from '@/db';
import { users } from '@/db/schema';
import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ProjectForm } from '../project-form';

export const metadata: Metadata = {
  title: 'انشر مشروعك الجديد | خدمات',
};

function AdminBlock() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 text-center">
        <p className="text-lg font-bold text-slate-800">نشر المشاريع متاح لحسابات العملاء والمستقلين.</p>
        <Link href="/dashboard" className="mt-6 inline-block rounded-lg bg-[#2386c8] px-8 py-3 text-sm font-semibold text-white hover:bg-[#1a6da8]">
          العودة للوحة التحكم
        </Link>
      </div>
    </div>
  );
}

export default async function NewProjectPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role === 'admin') {
    return <AdminBlock />;
  }

  if (currentUser.role === 'freelancer') {
    const [account] = await db
      .select({
        phone: users.phone,
        bio: users.bio,
        skills: users.skills,
        isKycVerified: users.isKycVerified,
      })
      .from(users)
      .where(eq(users.id, currentUser.id))
      .limit(1);

    if (!account?.phone || !account?.bio || !account?.skills) {
      redirect('/dashboard/setup');
    }

    if (!account.isKycVerified) {
      const kycDoc = await getLatestKycDocument(currentUser.id);

      if (kycDoc?.status === 'pending') {
        redirect('/dashboard/pending-review');
      }

      if (kycDoc?.status === 'rejected') {
        redirect('/dashboard/kyc?rejected=1');
      }

      redirect('/dashboard/kyc');
    }
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
