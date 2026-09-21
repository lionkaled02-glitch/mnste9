/**
 * ============================================================================
 *  mnste9 — الملف الشخصي (/dashboard/profile) — المرحلة 10 محسّن
 * ============================================================================
 *  التحسينات (المرحلة 10):
 *   - صورة رمزية دائرية كبيرة (h-28 w-28) بحرف الاسم.
 *   - شارة "موثّق" إذا كان KYC موثّق (badge فوق الصورة + بجانب الاسم).
 *   - بطاقة تعريف محسّنة بظل خفيف.
 *   - نموذج محسن: المهارات كـ tags قابلة للحذف والإضافة + مهارات مقترحة.
 *
 *  الحماية: middleware + getCurrentUser
 * ============================================================================
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { getRoleLabel, KYC_LABELS } from '@/lib/services/user-meta';

import { ProfileForm } from './profile-form';

export const metadata: Metadata = {
  title: 'الملف الشخصي',
};

function SessionExpiredCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-lg font-bold text-slate-800">انتهت جلستك</p>
      <p className="mt-2 text-sm leading-7 text-slate-500">
        سجّل دخولك من جديد للوصول إلى ملفك الشخصي.
      </p>
      <Link
        href="/login?from=/dashboard/profile"
        className="mt-6 inline-block rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        تسجيل الدخول
      </Link>
    </div>
  );
}

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return <SessionExpiredCard />;
  }

  const [profile] = await db
    .select({
      name: users.name,
      email: users.email,
      role: users.role,
      isKycVerified: users.isKycVerified,
      createdAt: users.createdAt,
      phone: users.phone,
      city: users.city,
      preferredCurrency: users.preferredCurrency,
      skills: users.skills,
      bio: users.bio,
      hourlyRate: users.hourlyRate,
    })
    .from(users)
    .where(eq(users.id, currentUser.id))
    .limit(1);

  if (!profile) {
    return <SessionExpiredCard />;
  }

  const initial = profile.name.trim().charAt(0) || 'م';
  const isFreelancer = profile.role === 'freelancer';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">الملف الشخصي</h1>
        <p className="mt-1 text-sm text-slate-500">حدّث بياناتك الأساسية ومعلوماتك المهنية</p>
      </div>

      {/* بطاقة التعريف — صورة كبيرة + شارة موثّق */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          {/* الصورة الرمزية الكبيرة */}
          <div className="relative shrink-0">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-4xl font-bold text-emerald-800 shadow-inner ring-4 ring-emerald-50">
              {initial}
            </div>
            {profile.isKycVerified && (
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md ring-2 ring-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75 7.5 15 15 9.75" />
                </svg>
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-right">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
              {profile.isKycVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                  موثّق
                </span>
              )}
            </div>

            <p dir="ltr" className="mt-2 text-left text-sm text-slate-500 sm:text-right">
              {profile.email}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs sm:justify-start">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                {getRoleLabel(profile.role)}
              </span>
              <span
                className={
                  profile.isKycVerified
                    ? 'rounded-full bg-emerald-100 px-3 py-1.5 font-semibold text-emerald-800'
                    : 'rounded-full bg-amber-100 px-3 py-1.5 font-medium text-amber-800'
                }
              >
                {profile.isKycVerified ? KYC_LABELS.verified : KYC_LABELS.unverified}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
                عضو منذ {formatDate(profile.createdAt)}
              </span>
            </div>

            {profile.isKycVerified ? (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                حسابك موثّق — تظهر شارة التوثيق لأصحاب العمل وتزيد ثقتك.
              </p>
            ) : (
              <Link
                href="/dashboard/kyc"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                وثّق هويتك الآن للحصول على شارة موثّق
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* نموذج التعديل */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <ProfileForm
          defaultValues={{
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            city: profile.city,
            preferredCurrency: profile.preferredCurrency,
            skills: profile.skills,
            bio: profile.bio,
            hourlyRate: profile.hourlyRate,
          }}
          isFreelancer={isFreelancer}
        />
      </section>
    </div>
  );
}
