/**
 * ============================================================================
 *  mnste9 — الصفحة الرئيسية (/) — المرحلة 10 محسّنة
 * ============================================================================
 *  التحسينات:
 *   - يستخدم SiteHeader (يخفي login/register بعد تسجيل الدخول ويعرض Avatar).
 *   - يستخدم SiteFooter (4 أعمدة + وسائل دفع بنك الكريمي و PayPal).
 *   - كيف تعمل المنصة: 4 خطوات مع أيقونات مميزة بدل أرقام فقط.
 *   - تحسين بصري طفيف مع الحفاظ على Tailwind و RTL.
 * ============================================================================
 */

import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'وظّف أفضل المستقلين بأمان تام',
};

const FEATURES = [
  {
    title: 'ضمان مالي (Escrow)',
    description:
      'يُحجز مبلغ المشروع في محفظة محمية، ولا يُحرَّر للمستقل إلا بعد إتمام العمل والموافقة عليه.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
      />
    ),
  },
  {
    title: 'KYC إلزامي',
    description:
      'توثيق الهوية إلزامي لكل مستخدم قبل التعامل — هوية موثّقة تعني مسؤولية واضحة وثقة متبادلة.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5a2.25 2.25 0 0 0 2.25 2.25Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z"
      />
    ),
  },
  {
    title: 'دفع ببنك الكريمي',
    description:
      'أودع أموالك بسهولة عبر حوالات بنك الكريمي المحلية — خيار مثالي للمستخدمين في اليمن.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"
      />
    ),
  },
  {
    title: 'دفع بـ PayPal',
    description:
      'للعملاء الدوليين والمستقلين خارج اليمن — إيداع وسحب فوري عبر PayPal بعملة الدولار.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5a2.25 2.25 0 0 0 2.25 2.25Z"
      />
    ),
  },
] as const;

// كيف تعمل المنصة — 4 خطوات مع أيقونات
const STEPS = [
  {
    number: '١',
    title: 'سجّل حسابك',
    description: 'أنشئ حسابك في دقيقة واختر نوع حسابك: صاحب عمل أو مستقل، ثم وثّق هويتك.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
      />
    ),
  },
  {
    number: '٢',
    title: 'انشر أو تصفح',
    description: 'أصحاب العمل ينشرون مشاريعهم، والمستقلون يتصفحون الفرص المناسبة لمهاراتهم.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    ),
  },
  {
    number: '٣',
    title: 'اتفق ونفّذ بأمان',
    description: 'المبلغ يُحجز في الضمان (Escrow). المستقل ينفذ، والعميل يتابع حتى التسليم.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
      />
    ),
  },
  {
    number: '٤',
    title: 'استلم وادفع',
    description: 'بعد الموافقة، يُحرر المبلغ تلقائياً للمستقل مع خصم عمولة المنصة 15%.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
      />
    ),
  },
] as const;

const SPECIALTIES = [
  {
    title: 'برمجة وتطوير المواقع',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
    ),
  },
  {
    title: 'تطبيقات الجوال',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    ),
  },
  {
    title: 'تصميم وهوية بصرية',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
    ),
  },
  {
    title: 'تسويق رقمي',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.097.216.084.469-.074.67-.289.368-.578.707-.833 1.014m0 0a48.12 48.12 0 0 1-4.363-1.53m4.363 1.53c3.744 1.327 7.91.78 11.05-1.53M3.49 15.66c-.257.216-.465.49-.578.797-.316.867-.174 1.922.465 2.99m15.84-9.1a48.11 48.11 0 0 0-3.478-3.937m0 0a48.115 48.115 0 0 0-3.14-2.67m0 0a.374.374 0 0 1-.268-.112m4.408 6.719a48.13 48.13 0 0 1 2.057 2.62M2.34 8.715a48.13 48.13 0 0 1 2.058-2.62m12.326 3.299c.404.405.788.83 1.15 1.273M6.08 9.4a9.06 9.06 0 0 1 2.058-.16c.898 0 1.78.118 2.62.34" />
    ),
  },
  {
    title: 'كتابة وترجمة',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 18.549 6.174m0 0L20.236 7.86m-1.687-1.687L16.862 4.487ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9.5-8.5c.28.28.44.66.44 1.06v11.88c0 .4-.16.78-.44 1.06l-4 4c-.28.28-.66.44-1.06.44H4.5c-.4 0-.78-.16-1.06-.44l-4-4A1.5 1.5 0 0 1 2 19.44V7.56c0-.4.16-.78.44-1.06l4-4c.28-.28.66-.44 1.06-.44h11.88c.4 0 .78.16 1.06.44l4 4Z" />
    ),
  },
  {
    title: 'مونتاج وفيديو',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
    ),
  },
  {
    title: 'محاسبة وأعمال',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.89 4.5 5.199V6h15V5.199c0-1.309-.807-2.498-1.907-2.627A41.565 41.565 0 0 0 12 2.25Z" />
    ),
  },
  {
    title: 'دعم فني وإدخال بيانات',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 0 1 0 12.728m0 0-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 0 1 0 7.072m0 0-2.829-2.829m-4.243 2.829a4.978 4.978 0 0 1-1.414-2.83m-1.414 5.658a9 9 0 0 1-2.167-9.238m7.824 2.167a1 1 0 1 1 2.828 2.83" />
    ),
  },
] as const;

function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        {children}
      </svg>
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:py-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            منصة العمل الحر الآمنة — ضمان مالي + KYC
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
            وظّف أفضل المستقلين بأمان تام
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            منصة عمل حر عربية. ضمان مالي، KYC إلزامي، دفع ببنك الكريمي و PayPal. عمولة 15% فقط.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/projects"
              className="w-full rounded-xl bg-emerald-600 px-8 py-3.5 text-center font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto"
            >
              تصفح المشاريع
            </Link>
            <Link
              href="/register"
              className="w-full rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-center font-semibold text-gray-700 transition hover:border-emerald-600 hover:text-emerald-700 sm:w-auto"
            >
              انشر مشروعك
            </Link>
          </div>
        </div>
      </section>

      {/* الميزات الأربع */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <h3 className="mt-5 text-base font-bold text-gray-900">{feature.title}</h3>
                <p className="mt-2.5 text-sm leading-6 text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* كيف تعمل المنصة — 4 خطوات مع أيقونات */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">كيف تعمل المنصة؟</h2>
            <p className="mt-4 text-gray-500">
              أربع خطوات بسيطة تفصلك عن أول مشروع لك — سواء كنت صاحب عمل أو مستقلاً.
            </p>
          </div>

          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li
                key={step.number}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">
                    {step.number}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      {step.icon}
                    </svg>
                  </span>
                </div>
                <h3 className="mt-5 text-base font-bold text-gray-900">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-6 text-gray-500">{step.description}</p>
                <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-emerald-50 opacity-60" />
              </li>
            ))}
          </ol>

          <div className="mt-10 flex justify-center">
            <Link
              href="/about"
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
            >
              تعرف على قصتنا ورؤيتنا ←
            </Link>
          </div>
        </div>
      </section>

      {/* تصفح حسب التخصص */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">تصفح حسب التخصص</h2>
            <p className="mt-4 text-gray-500">مهارات متنوعة بانتظار مشاريعك — اختر مجالك وابدأ.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SPECIALTIES.map((specialty) => (
              <Link
                key={specialty.title}
                href="/projects"
                className="group rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:border-emerald-400 hover:shadow"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    {specialty.icon}
                  </svg>
                </span>
                <span className="mt-4 block text-sm font-semibold text-gray-800">{specialty.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-600">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">جاهز للبدء؟</h2>
          <p className="mx-auto mt-4 max-w-xl text-emerald-100">
            انضم إلى mnste9 اليوم — حساب مجاني، توثيق آمن، وأموالك محمية من أول مشروع إلى آخره.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="w-full rounded-xl bg-white px-10 py-3.5 font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 sm:w-auto"
            >
              إنشاء حساب مجاني
            </Link>
            <Link
              href="/help"
              className="w-full rounded-xl border border-emerald-400 bg-emerald-600 px-10 py-3.5 font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
            >
              مركز المساعدة
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
