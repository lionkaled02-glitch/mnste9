/**
 * ============================================================================
 *  mnste9 — من نحن (/about) — المرحلة 10
 * ============================================================================
 *  قصة المنصة، الرؤية/الرسالة، القيم الأساسية.
 *  تصميم بسيط RTL — Tailwind فقط — مع SiteHeader/Footer.
 * ============================================================================
 */

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';


export const metadata: Metadata = {
  title: 'من نحن',
};

const VALUES = [
  {
    title: 'الأمان أولاً',
    description: 'ضمان مالي (Escrow) يحمي الطرفين — لا دفع إلا بعد رضا العميل.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
      />
    ),
  },
  {
    title: 'هوية موثّقة',
    description: 'KYC إلزامي للمستقلين — نعرف من نتعامل معه، ونبني ثقة حقيقية.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5a2.25 2.25 0 0 0 2.25 2.25Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z"
      />
    ),
  },
  {
    title: 'عدالة وشفافية',
    description: 'عمولة ثابتة 15% — لا رسوم خفية. نزاعات تُحل بإنصاف وسرعة.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
  {
    title: 'محلي وعالمي',
    description: 'بنك الكريمي لليمن، و PayPal للعالم — USD و SAR، بلا تعقيد.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
      />
    ),
  },
] as const;

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-emerald-50 to-white">
          <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
              🇾🇪 صنع في اليمن — لخدمة المنطقة العربية
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              قصتنا: منصة عمل حر آمنة للجميع
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600">
              بدأت mnste9 من مشكلة حقيقية: أصحاب الأعمال يخافون من الاحتيال، والمستقلون يخافون من عدم الدفع.
              قررنا بناء حل بسيط — ضمان مالي، توثيق هوية، ودفع محلي وعالمي.
            </p>
          </div>
        </section>

        {/* القصة */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">القصة</h2>
              <p className="mt-4 text-sm leading-8 text-slate-600">
                في 2024، لاحظنا أن المنصات العالمية لا تدعم الدفع المحلي في اليمن، والمنصات المحلية تفتقر للضمان المالي
                الحقيقي. كثير من المستقلين يعملون بلا حماية، وكثير من العملاء يخسرون أموالهم.
              </p>
              <p className="mt-4 text-sm leading-8 text-slate-600">
                mnste9 جاءت لتكون الجسر: بنك الكريمي للحوالات المحلية (USD/SAR)، و PayPal للدولي، مع نظام Escrow يحجز
                المبلغ حتى يرضى العميل. و KYC إلزامي للمستقلين لضمان هوية حقيقية.
              </p>
              <p className="mt-4 text-sm leading-8 text-slate-600">
                اليوم، نخدم مئات المستخدمين في اليمن والخليج، ونطمح لنكون المنصة الأولى للعمل الحر العربي الآمن.
              </p>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <h3 className="flex items-center gap-2 text-base font-bold text-emerald-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-2.74a48.043 48.043 0 0 0-3.24-3.183L18 6.75l-1.5 1.5-1.5-1.5L12 9.75 9 6.75 7.5 8.25 9 9.75 6 12.75 2.25 18Z" />
                    </svg>
                  </span>
                  رؤيتنا
                </h3>
                <p className="mt-3 text-sm leading-7 text-emerald-900/80">
                  أن نكون المنصة الأكثر ثقة للعمل الحر في العالم العربي — حيث يجد كل صاحب عمل المستقل المناسب، وكل مستقل
                  الفرصة العادلة، بلا خوف من الاحتيال أو ضياع الحقوق.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </span>
                  رسالتنا
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  تمكين المواهب العربية عبر بيئة عمل آمنة، شفافة، وعادلة — بضمان مالي حقيقي، توثيق هوية إلزامي، ودعم فني
                  يتدخل عند الحاجة. نؤمن أن الثقة هي عملة العمل الحر.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* القيم الأساسية */}
        <section className="border-t border-slate-100 bg-slate-50">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">قيمنا الأساسية</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                4 مبادئ لا نتنازل عنها — هي ما يميز mnste9 عن أي منصة أخرى.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {VALUES.map((value) => (
                <div key={value.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        {value.icon}
                      </svg>
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{value.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* أرقام سريعة + CTA */}
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <div className="grid gap-6 rounded-2xl bg-slate-900 p-8 text-white sm:grid-cols-3">
              <div className="text-center">
                <p className="text-3xl font-bold">15%</p>
                <p className="mt-1 text-sm text-slate-300">عمولة ثابتة — بلا مفاجآت</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">KYC</p>
                <p className="mt-1 text-sm text-slate-300">توثيق إلزامي للمستقلين</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">Escrow</p>
                <p className="mt-1 text-sm text-slate-300">ضمان مالي يحمي الطرفين</p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <h3 className="text-xl font-bold text-slate-900">انضم إلينا اليوم</h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                سواء كنت صاحب عمل تبحث عن محترفين، أو مستقلاً تبحث عن فرص حقيقية — mnste9 هو مكانك الآمن.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/register"
                  className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  إنشاء حساب مجاني
                </Link>
                <Link
                  href="/help"
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  مركز المساعدة
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      
    </div>
  );
}
