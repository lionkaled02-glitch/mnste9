/**
 * ============================================================================
 *  خدمات — صفحة تصفح المستقلين (/freelancers) — المرحلة أ
 * ============================================================================
 *  Header/Footer من layout.tsx
 * ============================================================================
 */

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';

import { FavoriteButton } from '@/components/favorite-button';
import { getCurrentUser } from '@/lib/auth';
import { listFreelancers } from '@/lib/services/freelancers';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'تصفح المستقلين',
};

interface FreelancersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
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

function FreelancerCard({
  id,
  name,
  specialty,
  isKycVerified,
  createdAt,
  isLoggedIn,
}: {
  id: number;
  name: string;
  specialty: string;
  isKycVerified: boolean;
  createdAt: Date;
  isLoggedIn: boolean;
}) {
  const initial = name.trim().charAt(0) || 'م';

  return (
    <article className="relative flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:shadow">
      <div className="absolute left-4 top-4">
        <FavoriteButton type="freelancer" id={id} isLoggedIn={isLoggedIn} />
      </div>

      <div className="relative">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-xl font-bold text-emerald-800">
          {initial}
        </span>
        {isKycVerified && (
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow ring-2 ring-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75 7.5 15 15 9.75" />
            </svg>
          </span>
        )}
      </div>

      <h2 className="mt-4 flex items-center gap-1.5 font-bold text-gray-900">
        {name}
        {isKycVerified && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">موثّق</span>}
      </h2>
      <p className="mt-1 text-sm text-gray-500">{specialty}</p>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span
          className={
            isKycVerified
              ? 'rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800'
              : 'rounded-full bg-gray-100 px-3 py-1 text-gray-600'
          }
        >
          {isKycVerified ? 'هوية موثّقة ✓' : 'غير موثّق'}
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">عضو منذ {formatDate(createdAt)}</span>
      </div>

      <Link
        href={`/freelancers/${id}`}
        className="mt-5 w-full rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
      >
        عرض الملف
      </Link>
    </article>
  );
}

export default async function FreelancersPage({ searchParams }: FreelancersPageProps) {
  const resolvedSearchParams = await searchParams;

  const rawSearch = firstParam(resolvedSearchParams, 'q')?.trim();
  const search = rawSearch || undefined;

  const [freelancers, currentUser] = await Promise.all([listFreelancers({ search }), getCurrentUser()]);

  const isLoggedIn = Boolean(currentUser);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">تصفح المستقلين</h1>
      <p className="mt-1 text-sm text-gray-500">ابحث عن المستقل المناسب لمشروعك القادم</p>

      <form action="/freelancers" method="get" className="mt-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={search ?? ''}
          placeholder="ابحث بالاسم…"
          aria-label="البحث عن مستقل بالاسم"
          className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          بحث
        </button>
      </form>

      {search && (
        <p className="mt-4 text-sm text-gray-500">
          نتائج البحث عن «{search}»: {formatFreelancerCount(freelancers.length)}
        </p>
      )}

      <div className="mt-6">
        {freelancers.length === 0 ? (
          search ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
              <p className="text-lg font-medium text-gray-600">لا نتائج مطابقة لبحثك</p>
              <p className="mt-2 text-sm text-gray-400">جرّب اسماً آخر أو تصفّح جميع المستقلين</p>
              <Link
                href="/freelancers"
                className="mt-6 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-emerald-600 hover:text-emerald-700"
              >
                إزالة البحث
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
              <p className="text-lg font-medium text-gray-600">لا يوجد مستقلون حالياً</p>
              <p className="mt-2 text-sm text-gray-400">ستظهر هنا قائمة المستقلين بعد انضمامهم إلى المنصة</p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {freelancers.map((freelancer) => (
              <FreelancerCard
                key={freelancer.id}
                id={freelancer.id}
                name={freelancer.name}
                specialty={freelancer.specialty}
                isKycVerified={freelancer.isKycVerified}
                createdAt={freelancer.createdAt}
                isLoggedIn={isLoggedIn}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
