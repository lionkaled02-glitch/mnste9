/**
 * ============================================================================
 *  خدمات — صفحة تصفح المستقلين (/freelancers) — بحث وفلترة متقدمة
 * ============================================================================
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';

import { getWishlistItemIdSet } from '@/app/actions/wishlist';
import { FavoriteButton } from '@/components/favorite-button';
import { getCurrentUser } from '@/lib/auth';
import {
  FREELANCER_SORT_OPTIONS,
  listFreelancers,
  parseFreelancerRateParam,
  parseFreelancerSortParam,
  parseFreelancerTextParam,
  parseFreelancerVerifiedParam,
} from '@/lib/services/freelancers';
import { parseCategoryParam, PROJECT_CATEGORIES } from '@/lib/services/project-meta';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'تصفح المستقلين',
};

export const dynamic = 'force-dynamic';

interface FreelancersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(searchParams: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatFreelancerCount(count: number): string {
  if (count === 0) return 'لا مستقلين';
  if (count === 1) return 'مستقل واحد';
  if (count === 2) return 'مستقلان';
  if (count >= 3 && count <= 10) return `${count} مستقلين`;
  return `${count} مستقلاً`;
}

function ActiveChip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-[#2386c8]/20 bg-[#2386c8]/10 px-3 py-1 text-xs font-bold text-[#2386c8]">{children}</span>;
}

function FreelancerCard({
  id,
  name,
  specialty,
  isKycVerified,
  createdAt,
  avatarUrl,
  city,
  skills,
  bio,
  hourlyRate,
  isLoggedIn,
  isWishlisted,
}: {
  id: number;
  name: string;
  specialty: string;
  isKycVerified: boolean;
  createdAt: Date;
  avatarUrl: string | null;
  city: string | null;
  skills: string | null;
  bio: string | null;
  hourlyRate: string | null;
  isLoggedIn: boolean;
  isWishlisted: boolean;
}) {
  const initial = name.trim().charAt(0) || 'م';
  const skillItems = (skills ?? '').split(',').map((skill) => skill.trim()).filter(Boolean).slice(0, 4);

  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#2386c8]/30 hover:shadow-lg">
      <div className="absolute left-4 top-4 z-10">
        <FavoriteButton type="freelancer" id={id} isLoggedIn={isLoggedIn} initialFavorited={isWishlisted} />
      </div>

      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={name} loading="lazy" className="h-16 w-16 rounded-2xl object-cover ring-2 ring-[#2386c8]/10" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e0f2fe] to-[#2386c8]/20 text-xl font-extrabold text-[#2386c8]">
              {initial}
            </span>
          )}
          {isKycVerified && (
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow ring-2 ring-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75 7.5 15 15 9.75" />
              </svg>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 pe-10">
          <h2 className="truncate text-lg font-extrabold text-slate-950">{name}</h2>
          <p className="mt-1 text-sm font-bold text-[#2386c8]">{specialty}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className={isKycVerified ? 'rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700' : 'rounded-full bg-slate-100 px-2.5 py-1 text-slate-600'}>
              {isKycVerified ? 'موثّق ✓' : 'غير موثّق'}
            </span>
            {city && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{city}</span>}
            {hourlyRate && <span className="rounded-full bg-[#2386c8]/10 px-2.5 py-1 font-bold text-[#2386c8]">${hourlyRate}/ساعة</span>}
          </div>
        </div>
      </div>

      {bio && <p className="mt-4 line-clamp-2 min-h-12 text-sm leading-6 text-slate-500">{bio}</p>}

      {skillItems.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {skillItems.map((skill) => <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">{skill}</span>)}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="text-xs text-slate-400">عضو منذ {formatDate(createdAt)}</span>
        <Link href={`/freelancers/${id}`} className="rounded-xl bg-[#2386c8] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1a6da8]">
          عرض الملف
        </Link>
      </div>
    </article>
  );
}

export default async function FreelancersPage({ searchParams }: FreelancersPageProps) {
  const resolvedSearchParams = await searchParams;

  const search = parseFreelancerTextParam(firstParam(resolvedSearchParams, 'q'));
  const specialty = parseCategoryParam(firstParam(resolvedSearchParams, 'specialty'));
  const verified = parseFreelancerVerifiedParam(firstParam(resolvedSearchParams, 'verified'));
  const city = parseFreelancerTextParam(firstParam(resolvedSearchParams, 'city'), 60);
  const minRate = parseFreelancerRateParam(firstParam(resolvedSearchParams, 'minRate'));
  const maxRate = parseFreelancerRateParam(firstParam(resolvedSearchParams, 'maxRate'));
  const sort = parseFreelancerSortParam(firstParam(resolvedSearchParams, 'sort'));

  const [freelancers, currentUser, wishlistedFreelancers] = await Promise.all([
    listFreelancers({ search, specialty, verified, city, minRate, maxRate, sort }),
    getCurrentUser(),
    getWishlistItemIdSet('freelancer'),
  ]);

  const isLoggedIn = Boolean(currentUser);
  const specialtyLabel = specialty ? PROJECT_CATEGORIES.find((category) => category.slug === specialty)?.label : undefined;
  const hasFilters = Boolean(search || specialty || verified || city || minRate !== undefined || maxRate !== undefined || sort !== 'newest');

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold text-[#2386c8]">منصة خدمات</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">تصفح المستقلين</h1>
              <p className="mt-2 text-sm text-slate-500">ابحث، صفِّ، واختر المستقل الأنسب لمشروعك القادم.</p>
            </div>
            <div className="rounded-2xl border border-[#2386c8]/20 bg-[#2386c8]/5 px-5 py-3 text-sm font-bold text-[#2386c8]">
              {formatFreelancerCount(freelancers.length)} مطابق
            </div>
          </div>

          {hasFilters && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {search && <ActiveChip>بحث: {search}</ActiveChip>}
              {specialtyLabel && <ActiveChip>تخصص: {specialtyLabel}</ActiveChip>}
              {verified && <ActiveChip>{verified === 'verified' ? 'موثقون فقط' : 'غير موثقين'}</ActiveChip>}
              {city && <ActiveChip>مدينة: {city}</ActiveChip>}
              {(minRate !== undefined || maxRate !== undefined) && <ActiveChip>السعر: {minRate ?? 0}$ - {maxRate ?? '∞'}$</ActiveChip>}
              {sort !== 'newest' && <ActiveChip>ترتيب: {FREELANCER_SORT_OPTIONS.find((option) => option.value === sort)?.label}</ActiveChip>}
              <Link href="/freelancers" className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white hover:bg-black">مسح الفلاتر</Link>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <form className="sticky top-20 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" method="get">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-950">فلترة المستقلين</h2>
              {hasFilters && <Link href="/freelancers" className="text-xs font-bold text-[#2386c8]">مسح</Link>}
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">بحث شامل</label>
                <input name="q" defaultValue={search ?? ''} placeholder="اسم، مهارة، مدينة…" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/10" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">التخصص</label>
                <select name="specialty" defaultValue={specialty ?? ''} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/10">
                  <option value="">كل التخصصات</option>
                  {PROJECT_CATEGORIES.slice(0, 8).map((category) => <option key={category.slug} value={category.slug}>{category.label}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">حالة التوثيق</label>
                <select name="verified" defaultValue={verified ?? ''} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/10">
                  <option value="">الكل</option>
                  <option value="verified">موثق فقط</option>
                  <option value="unverified">غير موثق</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">المدينة</label>
                <input name="city" defaultValue={city ?? ''} placeholder="مثال: صنعاء" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/10" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">السعر بالساعة</label>
                <div className="grid grid-cols-2 gap-2">
                  <input name="minRate" type="number" min={0} defaultValue={minRate ?? ''} placeholder="من" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/10" />
                  <input name="maxRate" type="number" min={0} defaultValue={maxRate ?? ''} placeholder="إلى" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/10" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">الترتيب</label>
                <select name="sort" defaultValue={sort} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/10">
                  {FREELANCER_SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" className="mt-5 w-full rounded-xl bg-[#2386c8] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#1a6da8]">
              تطبيق الفلاتر
            </button>
          </form>
        </aside>

        <main className="lg:col-span-9">
          {freelancers.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2386c8]/10 text-3xl">🔎</div>
              <p className="mt-4 text-lg font-extrabold text-slate-700">لا توجد نتائج مطابقة</p>
              <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">جرّب تخفيف الفلاتر أو البحث بكلمة مختلفة للوصول إلى مستقلين أكثر.</p>
              <Link href="/freelancers" className="mt-6 rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-[#2386c8] hover:text-[#2386c8]">
                إزالة الفلاتر
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {freelancers.map((freelancer) => (
                <FreelancerCard
                  key={freelancer.id}
                  id={freelancer.id}
                  name={freelancer.name}
                  specialty={freelancer.specialty}
                  isKycVerified={freelancer.isKycVerified}
                  createdAt={freelancer.createdAt}
                  avatarUrl={freelancer.avatarUrl}
                  city={freelancer.city}
                  skills={freelancer.skills}
                  bio={freelancer.bio}
                  hourlyRate={freelancer.hourlyRate}
                  isLoggedIn={isLoggedIn}
                  isWishlisted={wishlistedFreelancers.has(freelancer.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
