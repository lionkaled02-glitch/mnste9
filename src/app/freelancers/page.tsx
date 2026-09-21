/**
 * ============================================================================
 *  mnste9 — صفحة تصفح المستقلين (/freelancers)
 * ============================================================================
 *  - العنوان "تصفح المستقلين" + بحث بالاسم (نموذج GET يعمل حتى مع تعطيل
 *    JavaScript — الحالة تعيش في معامل URL ?q= كروابط قابلة للمشاركة).
 *  - شبكة grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6.
 *  - بطاقة المستقل: صورة دائرية (دائرة زمردية بحرف الاسم — لا صور
 *    شخصيات في المخطط)، الاسم، التخصص المستنتج، شارة KYC، وزر
 *    "عرض الملف".
 *  - حالتا فراغ متميزتان: لا مستقلين على المنصة / لا نتائج للبحث.
 *
 *  ملاحظة موثّقة — هدف زر "عرض الملف":
 *   يشير إلى /freelancers/[id] — صفحة الملف العام للمستقل، وهي من
 *   مسارات المراحل القادمة؛ بنية الرابط مثبّتة الآن كي لا تتغير.
 * ============================================================================
 */

import type { Metadata } from 'next';
import Link from 'next/link';

import { listFreelancers } from '@/lib/services/freelancers';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'تصفح المستقلين',
};

interface FreelancersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** قراءة أول قيمة لمعامل URL (يتحمّل الصيغ المتعددة القيم) */
function firstParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

/** عدد المستقلين بصيغة عربية سليمة */
function formatFreelancerCount(count: number): string {
  if (count === 0) return 'لا مستقلين';
  if (count === 1) return 'مستقل واحد';
  if (count === 2) return 'مستقلان';
  if (count >= 3 && count <= 10) return `${count} مستقلين`;
  return `${count} مستقلاً`;
}

/** بطاقة مستقل */
function FreelancerCard({
  id,
  name,
  specialty,
  isKycVerified,
  createdAt,
}: {
  id: number;
  name: string;
  specialty: string;
  isKycVerified: boolean;
  createdAt: Date;
}) {
  const initial = name.trim().charAt(0) || 'م';

  return (
    <article className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
      {/* صورة دائرية — دائرة زمردية بحرف الاسم (لا صور في المخطط) */}
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">
        {initial}
      </span>

      <h2 className="mt-4 font-bold text-slate-900">{name}</h2>
      <p className="mt-1 text-sm text-slate-500">{specialty}</p>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span
          className={
            isKycVerified
              ? 'rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800'
              : 'rounded-full bg-slate-100 px-3 py-1 text-slate-600'
          }
        >
          {isKycVerified ? 'هوية موثّقة (KYC) ✓' : 'الهوية غير موثّقة بعد'}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
          عضو منذ {formatDate(createdAt)}
        </span>
      </div>

      {/* الملف العام — مسار مرحلة قادمة (راجع ترويسة الملف) */}
      <Link
        href={`/freelancers/${id}`}
        className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        عرض الملف
      </Link>
    </article>
  );
}

export default async function FreelancersPage({
  searchParams,
}: FreelancersPageProps) {
  const resolvedSearchParams = await searchParams;

  const rawSearch = firstParam(resolvedSearchParams, 'q')?.trim();
  const search = rawSearch || undefined;

  const freelancers = await listFreelancers({ search });

  return (
    <div className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* الترويسة */}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          تصفح المستقلين
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          ابحث عن المستقل المناسب لمشروعك القادم
        </p>

        {/* البحث — نموذج GET يعمل بلا JavaScript */}
        <form action="/freelancers" method="get" className="mt-6 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={search ?? ''}
            placeholder="ابحث بالاسم…"
            aria-label="البحث عن مستقل بالاسم"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            بحث
          </button>
        </form>

        {/* عدد النتائج عند البحث */}
        {search && (
          <p className="mt-4 text-sm text-slate-500">
            نتائج البحث عن «{search}»: {formatFreelancerCount(freelancers.length)}
          </p>
        )}

        {/* الشبكة / حالات الفراغ */}
        <div className="mt-6">
          {freelancers.length === 0 ? (
            search ? (
              /* لا نتائج مطابقة للبحث */
              <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                <p className="text-lg font-medium text-slate-600">
                  لا نتائج مطابقة لبحثك
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  جرّب اسماً آخر أو تصفّح جميع المستقلين
                </p>
                <Link
                  href="/freelancers"
                  className="mt-6 rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700"
                >
                  إزالة البحث
                </Link>
              </div>
            ) : (
              /* لا مستقلين على المنصة إطلاقاً */
              <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                <p className="text-lg font-medium text-slate-600">
                  لا يوجد مستقلون حالياً
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  ستظهر هنا قائمة المستقلين بعد انضمامهم إلى المنصة
                </p>
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
