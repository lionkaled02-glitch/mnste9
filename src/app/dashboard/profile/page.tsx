/**
 * ============================================================================
 *  mnste9 — الملف الشخصي (/dashboard/profile)
 * ============================================================================
 *  المحتوى (مواصفة المرحلة):
 *   - بطاقة التعريف: الصورة الرمزية (دائرة زمردية بحرف الاسم — لا عمود
 *     صور في المخطط)، الاسم، الدور، شارة KYC، «عضو منذ».
 *   - نموذج «حفظ التغييرات» (يعمل حتى مع تعطيل JavaScript):
 *       المعلومات الأساسية: الاسم، البريد (للعرض فقط — معرّف الدخول)،
 *       الهاتف.
 *       التفضيلات: العملة المفضلة (USD أو SAR حصراً — لا YER لأن بنك
 *       الكريمي لا يدعم الريال اليمني)، المدينة.
 *       المعلومات المهنية (للمستقلين فقط): المهارات، النبذة، السعر/الساعة.
 *
 *  الحماية:
 *   middleware يوجّه غير المسجلين إلى /login?from=/dashboard/profile؛
 *   وهنا فحص إضافي عبر getCurrentUser (دفاع متعدد الطبقات) — يشمل حالة
 *   حذف الحساب بين الطلبين (الصفحة تعرض بطاقة «انتهت جلستك»).
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

/** بطاقة «انتهت جلستك» — دفاع أخير خلف middleware */
function SessionExpiredCard() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-lg font-bold text-slate-800">انتهت جلستك</p>
      <p className="mt-2 text-sm leading-7 text-slate-500">
        سجّل دخولك من جديد للوصول إلى ملفك الشخصي.
      </p>
      <Link
        href="/login?from=/dashboard/profile"
        className="mt-6 inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        تسجيل الدخول
      </Link>
    </div>
  );
}

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  // دفاع أخير خلف middleware — الجلسة انتهت أو الحساب حُذف
  if (!currentUser) {
    return <SessionExpiredCard />;
  }

  // صف الملف الشخصي كاملاً — الأعمدة الجديدة (هجرة 00002) اختيارية
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

  // الحساب حُذف بين الطلبين (رغم صلاحية الرمز)
  if (!profile) {
    return <SessionExpiredCard />;
  }

  const initial = profile.name.trim().charAt(0) || 'م';
  const isFreelancer = profile.role === 'freelancer';

  return (
    <div className="space-y-6">
      {/* ترويسة الصفحة */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          الملف الشخصي
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          حدّث بياناتك الأساسية ومعلوماتك المهنية
        </p>
      </div>

      {/* بطاقة التعريف — الصورة الرمزية والحالة */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-right">
          {/* الصورة الرمزية — دائرة زمردية بحرف الاسم (لا عمود صور في المخطط) */}
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
            {initial}
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">{profile.name}</h2>
            <p dir="ltr" className="mt-1 text-sm text-slate-500">
              {profile.email}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs sm:justify-start">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                {getRoleLabel(profile.role)}
              </span>
              <span
                className={
                  profile.isKycVerified
                    ? 'rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800'
                    : 'rounded-full bg-slate-100 px-3 py-1 text-slate-600'
                }
              >
                {profile.isKycVerified
                  ? KYC_LABELS.verified
                  : KYC_LABELS.unverified}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                عضو منذ {formatDate(profile.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* نموذج التعديل — بيانات أساسية وتفضيلات ومعلومات مهنية */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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
