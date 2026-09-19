/**
 * ============================================================================
 *  mnste9 — الصفحة الرئيسية (/)
 * ============================================================================
 *  صفحة هبوط عربية (RTL) بتصميم هادئ واحترافي:
 *   - Hero: العنوان الرئيسي + زرا الإجراء (تصفح المشاريع / انشر مشروعك).
 *   - الميزات الأربع: الضمان المالي، KYC، دفع الكريمي، دفع PayPal.
 *   - كيف تعمل المنصة: 4 خطوات مرقّمة.
 *   - تصفح حسب التخصص: 8 بطاقات.
 *   - CTA: قسم أخضر زمردي للدعوة إلى إنشاء حساب.
 *
 *  ملاحظة: مكوّن سيرفر ثابت بالكامل (Static) — يُعرض فوراً بلا حالة.
 *  روابط الأزرار: "تصفح المشاريع" → /login (التصفح يتطلب حساباً في هذه
 *  المرحلة)، و"انشر مشروعك" و"إنشاء حساب مجاني" → /register.
 * ============================================================================
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'وظّف أفضل المستقلين بأمان تام',
};

/* ============================================================================
 * بيانات الأقسام (منفصلة عن العرض لسهولة الصيانة)
 * ========================================================================== */

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
        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
      />
    ),
  },
] as const;

const STEPS = [
  {
    number: '١',
    title: 'سجّل حسابك',
    description: 'أنشئ حسابك في دقيقة واحدة واختر نوع حسابك: صاحب عمل أو مستقل.',
  },
  {
    number: '٢',
    title: 'تصفح المشاريع',
    description: 'استعرض المشاريع المنشورة أو انشر مشروعك الخاص بتفاصيل وميزانية واضحة.',
  },
  {
    number: '٣',
    title: 'اربح من مهاراتك',
    description: 'قدّم عرضك على المشاريع التي تناسبك، واتفق على التفاصيل مع العميل مباشرة.',
  },
  {
    number: '٤',
    title: 'استلم أموالك بأمان',
    description: 'يُحجز المبلغ في الضمان المالي، ويصل إلى محفظتك فور إتمام العمل والموافقة.',
  },
] as const;

const SPECIALTIES = [
  { title: 'برمجة وتطوير المواقع', icon: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
  ) },
  { title: 'تطبيقات الجوال', icon: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
  ) },
  { title: 'تصميم وهوية بصرية', icon: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
  ) },
  { title: 'تسويق رقمي', icon: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.097.216.084.469-.074.67-.289.368-.578.707-.833 1.014m0 0a48.12 48.12 0 0 1-4.363-1.53m4.363 1.53c3.744 1.327 7.91.78 11.05-1.53M3.49 15.66c-.257.216-.465.49-.578.797-.316.867-.174 1.922.465 2.99m15.84-9.1a48.11 48.11 0 0 0-3.478-3.937m0 0a48.115 48.115 0 0 0-3.14-2.67m0 0a.374.374 0 0 1-.268-.112m4.408 6.719a48.13 48.13 0 0 1 2.057 2.62M2.34 8.715a48.13 48.13 0 0 1 2.058-2.62m12.326 3.299c.404.405.788.83 1.15 1.273M6.08 9.4a9.06 9.06 0 0 1 2.058-.16c.898 0 1.78.118 2.62.34" />
  ) },
  { title: 'كتابة وترجمة', icon: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 18.549 6.174m0 0L20.236 7.86m-1.687-1.687L16.862 4.487ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9.5-8.5c.28.28.44.66.44 1.06v11.88c0 .4-.16.78-.44 1.06l-4 4c-.28.28-.66.44-1.06.44H4.5c-.4 0-.78-.16-1.06-.44l-4-4A1.5 1.5 0 0 1 2 19.44V7.56c0-.4.16-.78.44-1.06l4-4c.28-.28.66-.44 1.06-.44h11.88c.4 0 .78.16 1.06.44l4 4Z" />
  ) },
  { title: 'مونتاج وفيديو', icon: (
    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
  ) },
  { title: 'محاسبة وأعمال', icon: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.89 4.5 5.199V6h15V5.199c0-1.309-.807-2.498-1.907-2.627A41.565 41.565 0 0 0 12 2.25Z" />
  ) },
  { title: 'دعم فني وإدخال بيانات', icon: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 0 1 0 12.728m0 0-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 0 1 0 7.072m0 0-2.829-2.829m-4.243 2.829a4.978 4.978 0 0 1-1.414-2.83m-1.414 5.658a9 9 0 0 1-2.167-9.238m7.824 2.167a1 1 0 1 1 2.828 2.83" />
  ) },
] as const;

/* ============================================================================
 * مكوّن داخلي: أيقونة موحّدة (خط Heroicons Outline)
 * ========================================================================== */

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

/* ============================================================================
 * الصفحة
 * ========================================================================== */

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      {/* ======================= الترويسة ======================= */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7 12 3 4 7v10l8 4 8-4V7Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4 7 8 4 8-4M12 21V11"
                />
              </svg>
            </span>
            <span className="text-lg font-bold text-gray-900">mnste9</span>
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 font-medium text-gray-600 transition hover:text-emerald-700"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
            >
              إنشاء حساب
            </Link>
          </nav>
        </div>
      </header>

      {/* ======================= Hero ======================= */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:py-28">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
            وظّف أفضل المستقلين بأمان تام
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            منصة عمل حر عربية. ضمان مالي، KYC إلزامي، دفع ببنك الكريمي
            و PayPal.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="w-full rounded-lg bg-emerald-600 px-8 py-3.5 text-center font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
            >
              تصفح المشاريع
            </Link>
            <Link
              href="/register"
              className="w-full rounded-lg border border-gray-300 px-8 py-3.5 text-center font-semibold text-gray-700 transition hover:border-emerald-600 hover:text-emerald-700 sm:w-auto"
            >
              انشر مشروعك
            </Link>
          </div>
        </div>
      </section>

      {/* ======================= الميزات الأربع ======================= */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <h3 className="mt-5 text-base font-bold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-gray-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= كيف تعمل المنصة ======================= */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              كيف تعمل المنصة؟
            </h2>
            <p className="mt-4 text-gray-500">
              أربع خطوات بسيطة تفصلك عن أول مشروع لك — سواء كنت صاحب عمل
              أو مستقلاً.
            </p>
          </div>

          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li
                key={step.number}
                className="rounded-2xl border border-gray-100 bg-white p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">
                  {step.number}
                </span>
                <h3 className="mt-5 text-base font-bold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-gray-500">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ======================= تصفح حسب التخصص ======================= */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              تصفح حسب التخصص
            </h2>
            <p className="mt-4 text-gray-500">
              مهارات متنوعة بانتظار مشاريعك — اختر مجالك وابدأ.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SPECIALTIES.map((specialty) => (
              <Link
                key={specialty.title}
                href="/login"
                className="group rounded-xl border border-gray-200 bg-white p-6 text-center transition hover:border-emerald-400"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    {specialty.icon}
                  </svg>
                </span>
                <span className="mt-4 block text-sm font-semibold text-gray-800">
                  {specialty.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= CTA ======================= */}
      <section className="bg-emerald-600">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            جاهز للبدء؟
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-emerald-100">
            انضم إلى mnste9 اليوم — حساب مجاني، توثيق آمن، وأموالك محمية
            من أول مشروع إلى آخره.
          </p>
          <Link
            href="/register"
            className="mt-10 inline-block rounded-lg bg-white px-10 py-3.5 font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            إنشاء حساب مجاني
          </Link>
        </div>
      </section>

      {/* ======================= التذييل ======================= */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7 12 3 4 7v10l8 4 8-4V7Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4 7 8 4 8-4M12 21V11"
                />
              </svg>
            </span>
            <span className="text-sm font-bold text-gray-900">mnste9</span>
          </div>
          <p className="text-sm text-gray-400">
            منصة العمل الحر العربية — جميع الحقوق محفوظة © ٢٠٢٦
          </p>
        </div>
      </footer>
    </div>
  );
}
