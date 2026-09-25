/**
 * خدمات — ملف المستقل الكامل
 * يحتوي على KYC وPortfolio والبيانات المهنية والتقييمات المستلمة والمعطاة.
 */

import { Link } from '@/i18n/navigation';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema';
import { getRoleLabel, KYC_LABELS } from '@/lib/services/user-meta';
import { formatDate } from '@/lib/utils';

import { FreelancerProfileForm } from './profile-form-freelancer';


interface FreelancerProfileProps {
  user: { id: number; name: string; email: string; role: string };
}

export async function FreelancerProfile({ user }: FreelancerProfileProps) {
  const profile = await db
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
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)
    .then((r) => r[0]);

  if (!profile) return null;

  const initial = profile.name.trim().charAt(0) || 'م';
  const completedParts = [profile.phone, profile.skills, profile.bio, profile.hourlyRate, profile.isKycVerified].filter(Boolean).length;
  const completionPercent = Math.round((completedParts / 5) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">الملف الشخصي</h1>
        <p className="mt-1 text-sm text-slate-500">بياناتك المهنية ومعرض أعمالك وتوثيق الهوية.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="relative shrink-0">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.name} className="h-28 w-28 rounded-full object-cover shadow-inner ring-4 ring-[#2386c8]/10" />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#e0f2fe] to-[#2386c8]/20 text-4xl font-bold text-[#2386c8] shadow-inner ring-4 ring-[#2386c8]/10">
                {initial}
              </div>
            )}
            {profile.isKycVerified && (
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#2386c8] text-white shadow-md ring-2 ring-white">✓</span>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-right">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
              <span className="rounded-full bg-[#2386c8]/10 px-3 py-1.5 text-xs font-semibold text-[#2386c8]">
                {getRoleLabel(profile.role as 'freelancer')}
              </span>
              <span className={profile.isKycVerified ? 'rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800' : 'rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800'}>
                {profile.isKycVerified ? KYC_LABELS.verified : KYC_LABELS.unverified}
              </span>
            </div>
            <p dir="ltr" className="mt-2 text-left text-sm text-slate-500 sm:text-right">{profile.email}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs sm:justify-start">
              {profile.city && <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{profile.city}</span>}
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">عضو منذ {formatDate(profile.createdAt)}</span>
            </div>
            {profile.isKycVerified ? (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#2386c8]/10 px-3 py-2 text-xs font-medium text-[#2386c8]">
                حسابك موثّق — يمكنك تقديم العروض والسحب
              </p>
            ) : (
              <Link href="/dashboard/kyc" className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100">
                وثّق هويتك الآن — مطلوب لتقديم العروض والسحب
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-4 text-[18px] font-bold text-[#222]">إكمال الحساب</h2>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-[#2386c8]" style={{ width: `${completionPercent}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-500">اكتمل {completionPercent}% من بيانات المستقل.</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <FreelancerProfileForm
          defaultValues={{
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            city: profile.city,
            preferredCurrency: profile.preferredCurrency,
            skills: profile.skills,
            bio: profile.bio,
            hourlyRate: profile.hourlyRate,
            avatarUrl: profile.avatarUrl,
          }}
        />
      </section>

    </div>
  );
}
