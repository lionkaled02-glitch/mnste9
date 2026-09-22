/**
 * ============================================================================
 *  mnste9 — صفحة الملف العام للمستقل (/freelancers/[id]) — المرحلة 10 نهائي
 * ============================================================================
 *  - صورة كبيرة + شارة موثّق إذا KYC معتمد
 *  - الاسم + التخصص + المدينة
 *  - المهارات tags
 *  - النبذة التعريفية
 *  - سعر الساعة
 *  - التقييمات (قائمة فارغة placeholder)
 *  - زر تواصل مع المستقل (placeholder)
 *  - زر أضف للمفضلة (FavoriteButton)
 *  - تصميم Tailwind بسيط RTL
 * ============================================================================
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { FavoriteButton } from '@/components/favorite-button';
import { getCurrentUser } from '@/lib/auth';
import { getFreelancerById } from '@/lib/services/freelancers';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Props {
  params: Promise<{ id: string }>;
}

function parseId(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}

function parseSkills(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const numId = parseId(id);
  if (!numId) return { title: 'المستقل غير موجود' };
  const freelancer = await getFreelancerById(numId);
  return { title: freelancer ? `${freelancer.name} — مستقل` : 'المستقل غير موجود' };
}

export default async function FreelancerDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = parseId(id);
  if (!numId) notFound();

  const [freelancer, currentUser] = await Promise.all([getFreelancerById(numId), getCurrentUser()]);

  if (!freelancer) notFound();

  const isLoggedIn = Boolean(currentUser);
  const initial = freelancer.name.trim().charAt(0) || 'م';
  const skills = parseSkills(freelancer.skills);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Link
          href="/freelancers"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          ← العودة للمستقلين
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* بطاقة التعريف الرئيسية */}
          <div className="lg:col-span-1">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-4xl font-bold text-emerald-800 shadow-inner ring-4 ring-emerald-50">
                    {initial}
                  </div>
                  {freelancer.isKycVerified && (
                    <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow ring-2 ring-white">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75 7.5 15 15 9.75" />
                      </svg>
                    </span>
                  )}
                </div>

                <h1 className="mt-4 flex items-center gap-2 text-xl font-bold text-slate-900">
                  {freelancer.name}
                  {freelancer.isKycVerified && (
                    <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">موثّق</span>
                  )}
                </h1>
                <p className="mt-1 text-sm text-slate-500">{freelancer.specialty}</p>
                {freelancer.city && <p className="mt-1 text-xs text-slate-400">{freelancer.city}</p>}

                <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
                  <span
                    className={
                      freelancer.isKycVerified
                        ? 'rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800'
                        : 'rounded-full bg-amber-100 px-3 py-1 text-amber-800'
                    }
                  >
                    {freelancer.isKycVerified ? 'هوية موثّقة ✓' : 'غير موثّق بعد'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    عضو منذ {formatDate(freelancer.createdAt)}
                  </span>
                </div>

                {freelancer.hourlyRate && (
                  <div className="mt-5 w-full rounded-xl bg-emerald-50 p-4">
                    <p className="text-xs text-emerald-700">سعر الساعة</p>
                    <p dir="ltr" className="mt-1 text-2xl font-bold text-emerald-800">
                      {formatCurrency(freelancer.hourlyRate, 'USD')}/ساعة
                    </p>
                  </div>
                )}

                <div className="mt-6 flex w-full flex-col gap-3">
                  <button
                    type="button"
                    className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    onClick={() => alert('ميزة التواصل قريباً — حالياً placeholder')}
                  >
                    تواصل مع المستقل
                  </button>

                  <div className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-600">أضف للمفضلة</span>
                    <FavoriteButton type="freelancer" id={freelancer.id} isLoggedIn={isLoggedIn} size="md" />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* التفاصيل */}
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">النبذة التعريفية</h2>
              {freelancer.bio ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-8 text-slate-600">{freelancer.bio}</p>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                  لا توجد نبذة بعد.
                </p>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">المهارات</h2>
              {skills.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">لم يضف مهارات بعد.</p>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">التقييمات</h2>
              <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">★</span>
                <p className="mt-3 text-sm font-medium text-slate-600">لا توجد تقييمات بعد</p>
                <p className="mt-1 text-xs text-slate-400">سيتم عرض تقييمات العملاء هنا بعد إكمال المشاريع.</p>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">معلومات إضافية</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-slate-500">التخصص</dt>
                  <dd className="font-semibold text-slate-800">{freelancer.specialty}</dd>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-slate-500">المدينة</dt>
                  <dd className="font-semibold text-slate-800">{freelancer.city || 'غير محددة'}</dd>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-slate-500">عضو منذ</dt>
                  <dd className="font-semibold text-slate-800">{formatDate(freelancer.createdAt)}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
