import type { Metadata } from 'next';

import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';

import { ClientDashboard } from './client-dashboard';
import { FreelancerDashboard } from './freelancer-dashboard';

export const metadata: Metadata = {
  title: 'لوحة التحكم | خدمات',
};

export const dynamic = 'force-dynamic';

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

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return <SessionExpired />;

  if (user.role === 'client') {
    return <ClientDashboard user={user} />;
  }

  return <FreelancerDashboard />;
}
