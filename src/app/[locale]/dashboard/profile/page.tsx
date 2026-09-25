import type { Metadata } from 'next';

import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';

import { ClientProfile } from './client-profile';
import { FreelancerProfile } from './freelancer-profile';

export const metadata: Metadata = {
  title: 'الملف الشخصي | خدمات',
};

function SessionExpired() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-lg font-bold text-slate-800">انتهت جلستك</p>
      <p className="mt-2 text-sm leading-7 text-slate-500">سجّل دخولك من جديد للوصول إلى ملفك الشخصي.</p>
      <Link href="/login?from=/dashboard/profile" className="mt-6 inline-block rounded-xl bg-[#2386c8] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#1a6da8]">
        تسجيل الدخول
      </Link>
    </div>
  );
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return <SessionExpired />;

  if (user.role === 'client') {
    return <ClientProfile user={user} />;
  }

  return <FreelancerProfile user={user} />;
}
