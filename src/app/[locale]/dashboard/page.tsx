import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';

import { ClientDashboard } from './client-dashboard';
import { FreelancerDashboard } from './freelancer-dashboard';
import { getFreelancerSetupState } from './setup/setup-data';
import { isFreelancerSetupComplete } from './setup/setup-helpers';

export const metadata: Metadata = {
  title: 'لوحة التحكم | خدمات',
};

export const dynamic = 'force-dynamic';

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function SessionExpired() {
  return (
    <div className="rounded-[14px] border border-gray-200 bg-white p-10 text-center shadow-sm">
      <h2 className="text-[15px] font-bold text-[#222]">انتهت جلستك</h2>
      <p className="mt-2 text-[13px] text-[#666]">سجّل دخولك للوصول إلى لوحة التحكم</p>
      <Link href="/login" className="mt-5 inline-flex h-10 items-center justify-center rounded-[10px] bg-[#2386c8] px-6 text-[13px] font-bold text-white hover:bg-[#1a6da8]">
        تسجيل الدخول
      </Link>
    </div>
  );
}

function firstParam(searchParams: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function SetupCompleteMessage() {
  return (
    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-sm">
      🎉 تهانينا! اكتمل إعداد حسابك كمستقل، ويمكنك الآن استخدام لوحة التحكم.
    </div>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getCurrentUser();
  if (!user) return <SessionExpired />;

  const resolvedSearchParams = await searchParams;
  const setupCompletedNow = firstParam(resolvedSearchParams, 'setup') === 'complete';

  if (user.role === 'client') {
    return <ClientDashboard user={user} />;
  }

  if (user.role === 'freelancer') {
    const setupState = await getFreelancerSetupState(user.id);
    if (!isFreelancerSetupComplete(setupState)) redirect('/dashboard/setup');
  }

  return (
    <>
      {setupCompletedNow && <SetupCompleteMessage />}
      <FreelancerDashboard />
    </>
  );
}
