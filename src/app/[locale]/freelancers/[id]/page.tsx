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
 *  - معرض الأعمال (Portfolio) مع الصور المرفوعة
 *  - زر تواصل مع المستقل (ContactFreelancerButton — مكوّن عميل يفتح محادثة)
 *  - زر أضف للمفضلة (FavoriteButton)
 *  - تصميم Tailwind بسيط RTL
 *  ملاحظة: هذه صفحة سيرفر — لا تمرَّر معالجات أحداث (onClick…) هنا مباشرة؛
 *  أي تفاعل يوضع في مكوّن عميل مستقل (تجنّب خطأ
 *  "Event handlers cannot be passed to Client Component props").
 * ============================================================================
 */

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';

import { getUserPortfolio } from '@/app/actions/portfolio';
import { ContactFreelancerButton } from '@/components/contact-freelancer-button';
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

  const portfolio = await getUserPortfolio(freelancer.id);

  const isLoggedIn = Boolean(currentUser);
  const isSelf = currentUser?.id === freelancer.id;
  const initial = freelancer.name.trim().charAt(0) || 'م';
  const skills = parseSkills(freelancer.skills);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
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
                  {freelancer.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={freelancer.avatarUrl}
                      alt={freelancer.name}
                      className="h-28 w-28 rounded-full object-cover shadow-inner ring-4 ring-emerald-50"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-4xl font-bold text-emerald-800 shadow-inner ring-4 ring-emerald-50">
                      {initial}
                    </div>
                  )}
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
                  <ContactFreelancerButton freelancerId={freelancer.id} isLoggedIn={isLoggedIn} isSelf={isSelf} />

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
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">معرض الأعمال</h2>
                {portfolio.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{portfolio.length} عمل</span>
                )}
              </div>
              {portfolio.length > 0 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {portfolio.map((item) => (
                    <article key={item.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-[#2386c8]/30 hover:shadow-sm">
                      {item.imageUrl ? (
                        <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="block aspect-video overflow-hidden bg-slate-100" title="فتح الصورة بالحجم الكامل">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          />
                        </a>
                      ) : (
                        <div className="flex aspect-video items-center justify-center bg-slate-50 text-slate-300">
                          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                          </svg>
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="line-clamp-1 text-sm font-bold text-slate-900">{item.title}</h3>
                        {item.description && <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-slate-500">{item.description}</p>}
                        {item.externalUrl && (
                          <a
                            href={item.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2386c8] hover:underline"
                          >
                            زيارة العمل
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                  لم يضف أعمالاً إلى معرضه بعد.
                </p>
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
    </div>
  );
}
