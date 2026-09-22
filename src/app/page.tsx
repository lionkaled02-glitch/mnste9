/**
 * ============================================================================
 *  خدمات — الصفحة الرئيسية المحدثة 100% بأسلوب مستقل / Upwork
 * ============================================================================
 *  - Hero: عنوان جذاب + بحث سريع + CTA + شارات ثقة KYC Escrow Kuraimi PayPal
 *  - Categories Grid: 8 أقسام بطاقات
 *  - How It Works: خطوات للعميل + خطوات للمستقل
 *  - Escrow & Security Showcase
 *  - Latest Projects: جلب من قاعدة البيانات (مع fallback)
 *  - Bottom CTA
 *  - Tailwind فقط — RTL — Responsive Mobile First
 *  - force-dynamic لتجنب مشاكل DATABASE_URL أثناء البناء
 * ============================================================================
 */

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

type ProjectRow = {
  id: number;
  title: string;
  description: string;
  budgetMin: string;
  budgetMax: string;
  durationDays: number;
  status: string;
  createdAt: Date;
  clientId: number;
};

async function getLatestProjects(): Promise<ProjectRow[]> {
  try {
    // استيراد ديناميكي لتجنب فشل البناء عند عدم وجود DATABASE_URL
    const { db } = await import('@/db');
    const { projects } = await import('@/db/schema');
    const { desc, eq } = await import('drizzle-orm');
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.status, 'open'))
      .orderBy(desc(projects.createdAt))
      .limit(6);
    return rows as ProjectRow[];
  } catch {
    return [];
  }
}

function formatBudget(min: string, max: string) {
  const nMin = Number.parseFloat(min || '0');
  const nMax = Number.parseFloat(max || '0');
  if (!nMin && !nMax) return '—';
  if (nMin === nMax) return `$${nMin}`;
  return `$${nMin} - $${nMax}`;
}

function timeAgo(date: Date) {
  try {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'منذ يوم';
    if (days < 7) return `منذ ${days} أيام`;
    return new Date(date).toLocaleDateString('ar-YE');
  } catch {
    return '';
  }
}

export default async function HomePage() {
  const t = await getTranslations('Home');
  const latestProjects = await getLatestProjects();

  const categories = [
    {
      key: 'dev',
      title: t('categories.dev'),
      desc: t('categories.devDesc'),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
      ),
      count: '1,200+',
    },
    {
      key: 'design',
      title: t('categories.design'),
      desc: t('categories.designDesc'),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
      ),
      count: '900+',
    },
    {
      key: 'marketing',
      title: t('categories.marketing'),
      desc: t('categories.marketingDesc'),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      ),
      count: '700+',
    },
    {
      key: 'writing',
      title: t('categories.writing'),
      desc: t('categories.writingDesc'),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 19.5 7.125 7.5 19.125 3 21l1.875-4.5L16.862 4.487Zm0 0L19.5 7.125" />
      ),
      count: '650+',
    },
    {
      key: 'admin',
      title: t('categories.admin'),
      desc: t('categories.adminDesc'),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
      ),
      count: '500+',
    },
    {
      key: 'video',
      title: t('categories.video'),
      desc: t('categories.videoDesc'),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" />
      ),
      count: '400+',
    },
    {
      key: 'business',
      title: t('categories.business'),
      desc: t('categories.businessDesc'),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
      ),
      count: '350+',
    },
    {
      key: 'engineering',
      title: t('categories.engineering'),
      desc: t('categories.engineeringDesc'),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h2.25a.75.75 0 0 1 .75.75V6a.75.75 0 0 1-.75.75H3A.75.75 0 0 1 2.25 6V3.75A.75.75 0 0 1 3 3Zm0 0v18" />
      ),
      count: '300+',
    },
  ];

  return (
    <div className="flex flex-1 flex-col bg-[#f4f5f7]">
      {/* ===================== Hero Section ===================== */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-white">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2386c8]/[0.06] via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:py-16 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            {/* شارة علوية صغيرة */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2386c8]/15 bg-[#2386c8]/5 px-3.5 py-1.5 text-[12px] font-medium text-[#2386c8]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#2386c8]" />
              منصة العمل الحر العربية الأولى في اليمن
            </div>

            <h1 className="text-[30px] font-extrabold leading-[1.25] tracking-tight text-[#222] sm:text-[38px] lg:text-[48px]">
              {t('heroTitle').includes('عن بُعد') ? (
                <>
                  وظّف أفضل المستقلين <span className="relative inline-block text-[#2386c8]">عن بُعد<span className="absolute bottom-1 left-0 h-2 w-full -z-10 bg-[#2386c8]/10" /></span> باحترافية
                </>
              ) : (
                <>
                  {t('heroTitle').split(t('heroHighlight') || 'عن بُعد')[0]}
                  <span className="text-[#2386c8]">{t('heroHighlight')}</span>
                  {t('heroTitle').split(t('heroHighlight') || 'عن بُعد')[1] || ' باحترافية'}
                </>
              )}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-7 text-[#666] sm:text-[17px] sm:leading-8">
              {t('heroDescription')}
            </p>

            {/* شريط بحث سريع */}
            <form action="/projects" method="get" className="mx-auto mt-8 flex max-w-[640px] items-center gap-1.5 rounded-[12px] border border-gray-200 bg-white p-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition focus-within:border-[#2386c8] focus-within:ring-4 focus-within:ring-[#2386c8]/10">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </span>
                <input
                  type="search"
                  name="q"
                  placeholder={t('searchPlaceholder')}
                  className="h-12 w-full bg-transparent pr-11 pl-4 text-[14px] text-gray-800 placeholder:text-gray-400 outline-none"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-[9px] bg-[#2386c8] px-7 text-[14px] font-bold text-white shadow-sm transition hover:bg-[#1a6da8] focus:outline-none focus:ring-2 focus:ring-[#2386c8] focus:ring-offset-1"
              >
                {t('searchButton')}
              </button>
            </form>

            {/* اقتراحات سريعة */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[12px] text-[#888]">
              <span>الأكثر بحثاً:</span>
              <Link href="/projects?q=برمجة" className="rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[#555] transition hover:bg-[#2386c8] hover:text-white">برمجة</Link>
              <Link href="/projects?q=تصميم" className="rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[#555] transition hover:bg-[#2386c8] hover:text-white">تصميم</Link>
              <Link href="/projects?q=تسويق" className="rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[#555] transition hover:bg-[#2386c8] hover:text-white">تسويق</Link>
              <Link href="/projects?q=كتابة" className="rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[#555] transition hover:bg-[#2386c8] hover:text-white">كتابة</Link>
            </div>

            {/* CTA */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/projects/new"
                className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#2386c8] px-8 text-[14.5px] font-bold text-white shadow-[0_4px_12px_rgba(35,134,200,0.25)] transition hover:bg-[#1a6da8] hover:shadow-[0_6px_20px_rgba(35,134,200,0.35)] sm:w-auto"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t('heroCta')}
              </Link>
              <Link
                href="/projects"
                className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-white px-8 text-[14.5px] font-bold text-[#222] shadow-sm transition hover:border-[#2386c8] hover:text-[#2386c8] sm:w-auto"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                {t('heroSecondary')}
              </Link>
            </div>

            {/* شارات ثقة */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-[#f4f5f7] px-3.5 py-2 text-[12.5px] font-medium text-[#444]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                {t('trustBadges.kyc')}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-[#f4f5f7] px-3.5 py-2 text-[12.5px] font-medium text-[#444]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2386c8]/10 text-[#2386c8]">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                </span>
                {t('trustBadges.escrow')}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-[#f4f5f7] px-3.5 py-2 text-[12.5px] font-medium text-[#444]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                  </svg>
                </span>
                {t('trustBadges.payments')}
              </span>
            </div>

            {/* إحصائيات سريعة */}
            <div className="mt-12 grid grid-cols-2 gap-3 rounded-[14px] border border-gray-100 bg-[#fcfcfc] p-3 sm:grid-cols-4 sm:p-4">
              {[
                { value: '12,500+', label: t('stats.freelancers') },
                { value: '8,900+', label: t('stats.projects') },
                { value: '98%', label: t('stats.satisfaction') },
                { value: '24/7', label: t('stats.support') },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[10px] bg-white px-3 py-3 text-center shadow-sm border border-gray-100">
                  <div className="text-[18px] font-extrabold text-[#222]">{stat.value}</div>
                  <div className="mt-0.5 text-[11px] font-medium text-[#888]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== Categories Grid ===================== */}
      <section className="bg-[#f4f5f7] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-[22px] font-bold text-[#222] sm:text-[26px]">{t('categoriesTitle')}</h2>
            <p className="mt-3 text-[13.5px] leading-6 text-[#666]">{t('categoriesSubtitle')}</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.key}
                href={`/freelancers?skill=${encodeURIComponent(cat.title)}`}
                className="group relative flex flex-col rounded-[12px] border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#2386c8]/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#f4f5f7] text-[#2386c8] transition group-hover:bg-[#2386c8] group-hover:text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                      {cat.icon}
                    </svg>
                  </span>
                  <span className="rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[11px] font-semibold text-[#666] group-hover:bg-[#2386c8]/10 group-hover:text-[#2386c8]">
                    {cat.count}
                  </span>
                </div>
                <h3 className="mt-4 text-[14px] font-bold text-[#222] group-hover:text-[#2386c8]">{cat.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-5 text-[#777]">{cat.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-[12px] font-medium text-[#2386c8] opacity-0 transition group-hover:opacity-100">
                  <span>استكشاف</span>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== How It Works ===================== */}
      <section className="border-y border-gray-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-[22px] font-bold text-[#222] sm:text-[26px]">{t('howItWorksTitle')}</h2>
            <p className="mt-3 text-[13.5px] leading-6 text-[#666]">{t('howItWorksSubtitle')}</p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* للعميل */}
            <div className="rounded-[14px] border border-gray-200 bg-[#fcfcfc] p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#2386c8] text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-[15px] font-bold text-[#222]">{t('forClient')}</h3>
                  <p className="text-[12px] text-[#888]">3 خطوات لإنجاز مشروعك</p>
                </div>
              </div>

              <ol className="mt-7 space-y-6">
                {[
                  { n: '١', title: t('clientSteps.step1Title'), desc: t('clientSteps.step1Desc') },
                  { n: '٢', title: t('clientSteps.step2Title'), desc: t('clientSteps.step2Desc') },
                  { n: '٣', title: t('clientSteps.step3Title'), desc: t('clientSteps.step3Desc') },
                ].map((step, i, arr) => (
                  <li key={step.n} className="relative flex gap-4">
                    {i !== arr.length - 1 && <span className="absolute right-[17px] top-[40px] h-[calc(100%+8px)] w-px bg-gray-200" />}
                    <span className="relative z-10 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#2386c8] text-[14px] font-bold text-white shadow-sm">{step.n}</span>
                    <div className="min-w-0 flex-1 rounded-[10px] border border-gray-100 bg-white p-4 shadow-sm">
                      <h4 className="text-[13.5px] font-bold text-[#222]">{step.title}</h4>
                      <p className="mt-1.5 text-[12.5px] leading-6 text-[#666]">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* للمستقل */}
            <div className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#0e9f6e] text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-[15px] font-bold text-[#222]">{t('forFreelancer')}</h3>
                  <p className="text-[12px] text-[#888]">3 خطوات لبدء الربح</p>
                </div>
              </div>

              <ol className="mt-7 space-y-6">
                {[
                  { n: '١', title: t('freelancerSteps.step1Title'), desc: t('freelancerSteps.step1Desc') },
                  { n: '٢', title: t('freelancerSteps.step2Title'), desc: t('freelancerSteps.step2Desc') },
                  { n: '٣', title: t('freelancerSteps.step3Title'), desc: t('freelancerSteps.step3Desc') },
                ].map((step, i, arr) => (
                  <li key={step.n} className="relative flex gap-4">
                    {i !== arr.length - 1 && <span className="absolute right-[17px] top-[40px] h-[calc(100%+8px)] w-px bg-gray-200" />}
                    <span className="relative z-10 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#0e9f6e] text-[14px] font-bold text-white shadow-sm">{step.n}</span>
                    <div className="min-w-0 flex-1 rounded-[10px] border border-gray-100 bg-[#fcfcfc] p-4">
                      <h4 className="text-[13.5px] font-bold text-[#222]">{step.title}</h4>
                      <p className="mt-1.5 text-[12.5px] leading-6 text-[#666]">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== Escrow & Security ===================== */}
      <section className="relative overflow-hidden bg-[#f4f5f7] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2386c8]/10 px-3 py-1 text-[11px] font-bold text-[#2386c8]">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                ضمان خدمات
              </span>
              <h2 className="mt-4 text-[22px] font-extrabold leading-8 text-[#222] sm:text-[28px] sm:leading-9">
                {t('escrowTitle')}
              </h2>
              <p className="mt-3 text-[13.5px] leading-7 text-[#666] sm:text-[14px]">{t('escrowSubtitle')}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { title: t('escrowFeatures.safe'), desc: t('escrowFeatures.safeDesc'), color: 'bg-[#2386c8]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /> },
                  { title: t('escrowFeatures.track'), desc: t('escrowFeatures.trackDesc'), color: 'bg-[#0e9f6e]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12A2.25 2.25 0 0 0 4.5 20.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /> },
                  { title: t('escrowFeatures.refund'), desc: t('escrowFeatures.refundDesc'), color: 'bg-[#e74c3c]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /> },
                  { title: t('escrowFeatures.pay'), desc: t('escrowFeatures.payDesc'), color: 'bg-[#f59e0b]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /> },
                ].map((f) => (
                  <div key={f.title} className="rounded-[12px] border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-[8px] ${f.color} text-white`}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                          {f.icon}
                        </svg>
                      </span>
                      <h4 className="text-[13px] font-bold text-[#222]">{f.title}</h4>
                    </div>
                    <p className="mt-2.5 text-[12px] leading-5 text-[#666]">{f.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-3">
                <Link href="/help#guarantee" className="inline-flex h-10 items-center justify-center rounded-[8px] bg-[#222] px-5 text-[13px] font-bold text-white transition hover:bg-black">
                  {t('escrowCta')}
                </Link>
                <Link href="/help" className="inline-flex h-10 items-center justify-center rounded-[8px] border border-gray-200 bg-white px-5 text-[13px] font-bold text-[#444] transition hover:border-[#222] hover:text-[#222]">
                  الأسئلة الشائعة
                </Link>
              </div>
            </div>

            {/* بطاقة توضيحية للضمان */}
            <div className="relative">
              <div className="relative rounded-[16px] border border-gray-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2386c8]/10 text-[#2386c8] font-bold text-[14px]">خ</span>
                    <div>
                      <div className="text-[13px] font-bold text-[#222]">ضمان خدمات</div>
                      <div className="text-[11px] text-[#888]">نظام حماية متكامل</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">آمن 100%</span>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    { step: '1', label: 'صاحب العمل يدفع', desc: 'يتم حجز المبلغ في الضمان', active: true },
                    { step: '2', label: 'المستقل ينفذ العمل', desc: 'متابعة وتواصل مستمر', active: true },
                    { step: '3', label: 'التسليم والموافقة', desc: 'مراجعة العمل والموافقة', active: false },
                    { step: '4', label: 'تحرير المبلغ', desc: 'يُحول المبلغ للمستقل تلقائياً', active: false },
                  ].map((s) => (
                    <div key={s.step} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${s.active ? 'bg-[#2386c8] text-white' : 'bg-[#f4f5f7] text-[#999] border border-gray-200'}`}>{s.step}</span>
                        {s.step !== '4' && <span className={`mt-1 h-8 w-px ${s.active ? 'bg-[#2386c8]/30' : 'bg-gray-200'}`} />}
                      </div>
                      <div className={`flex-1 rounded-[10px] border p-3 ${s.active ? 'border-[#2386c8]/20 bg-[#2386c8]/[0.03]' : 'border-gray-100 bg-[#fcfcfc]'}`}>
                        <div className="text-[12.5px] font-bold text-[#222]">{s.label}</div>
                        <div className="text-[11px] text-[#777]">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[10px] bg-[#f4f5f7] p-3.5">
                  <div className="flex items-center justify-between text-[11px] text-[#666]">
                    <span>طرق الدفع المدعومة</span>
                    <span className="font-bold text-[#222]">آمن ومشفر</span>
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-white border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-[#444]"><span className="h-2 w-2 rounded-full bg-[#00a651]" />بنك الكريمي</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-white border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-[#444]"><span className="h-2 w-2 rounded-full bg-[#003087]" />PayPal</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-white border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-[#999]">Visa</span>
                  </div>
                </div>
              </div>

              {/* زخرفة خلفية */}
              <div className="absolute -bottom-6 -left-6 -z-10 h-32 w-32 rounded-full bg-[#2386c8]/10 blur-2xl" />
              <div className="absolute -top-6 -right-6 -z-10 h-24 w-24 rounded-full bg-emerald-100 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ===================== Latest Projects ===================== */}
      <section className="border-t border-gray-200 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-[20px] font-bold text-[#222] sm:text-[24px]">{t('latestProjectsTitle')}</h2>
              <p className="mt-2 text-[13px] text-[#666]">{t('latestProjectsSubtitle')}</p>
            </div>
            <Link href="/projects" className="inline-flex h-9 items-center justify-center rounded-[8px] border border-gray-200 bg-white px-4 text-[13px] font-bold text-[#444] transition hover:border-[#2386c8] hover:text-[#2386c8]">
              {t('viewAllProjects')}
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
              </svg>
            </Link>
          </div>

          {latestProjects.length === 0 ? (
            <div className="mt-10 rounded-[14px] border border-dashed border-gray-300 bg-[#fcfcfc] p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f5f7] text-gray-400">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <h3 className="mt-4 text-[14px] font-bold text-[#444]">{t('noProjects')}</h3>
              <Link href="/projects/new" className="mt-4 inline-flex h-9 items-center justify-center rounded-[8px] bg-[#2386c8] px-4 text-[13px] font-bold text-white hover:bg-[#1a6da8]">
                أضف أول مشروع
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latestProjects.map((project) => (
                <div key={project.id} className="group flex flex-col rounded-[12px] border border-gray-200 bg-white p-5 shadow-sm transition hover:border-[#2386c8]/20 hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-1 text-[14px] font-bold leading-6 text-[#222] group-hover:text-[#2386c8]">
                      <Link href={`/projects/${project.id}`}>{project.title}</Link>
                    </h3>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{t('open')}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[12.5px] leading-6 text-[#666]">{project.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[11px] font-medium text-[#555]">
                      <svg className="h-3.5 w-3.5 text-[#888]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12 12 12.5 12 12s-1.536-.5-2.121-1.5c-.586-.879-.586-2.303 0-3.182.586-.879 1.536-1.5 2.121-1.5s1.536.621 2.121 1.5M12 6a3 3 0 1 1 0 0" />
                      </svg>
                      {formatBudget(project.budgetMin, project.budgetMax)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[11px] font-medium text-[#555]">
                      <svg className="h-3.5 w-3.5 text-[#888]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      {project.durationDays} يوم
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[11px] font-medium text-[#888]">{timeAgo(project.createdAt)}</span>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                    <Link href={`/projects/${project.id}`} className="text-[12.5px] font-bold text-[#2386c8] hover:text-[#1a6da8]">
                      {t('viewDetails')} ←
                    </Link>
                    <span className="text-[11px] text-[#999]">#{project.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===================== Bottom CTA ===================== */}
      <section className="relative overflow-hidden bg-[#222] py-14 sm:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2386c8]/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-[22px] font-extrabold text-white sm:text-[28px]">{t('bottomCtaTitle')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[13.5px] leading-6 text-white/70">{t('bottomCtaDesc')}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/projects/new" className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-white px-8 text-[14px] font-bold text-[#222] shadow-sm transition hover:bg-gray-100 sm:w-auto">
              {t('bottomCtaButton')}
            </Link>
            <Link href="/freelancers" className="inline-flex h-12 w-full items-center justify-center rounded-[10px] border border-white/20 bg-transparent px-8 text-[14px] font-bold text-white transition hover:bg-white/10 sm:w-auto">
              تصفح المستقلين
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
