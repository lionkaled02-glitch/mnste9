/**
 * ============================================================================
 *  خدمات — الصفحة الرئيسية (/) — المرحلة أ
 * ============================================================================
 *  - Hero جذاب + 4 ميزات + 4 خطوات
 *  - يدعم العربية والإنجليزية
 *  - Header/Footer يأتيان من layout.tsx
 * ============================================================================
 */

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'وظّف أفضل المستقلين بأمان تام',
};

export default async function HomePage() {
  const t = await getTranslations('Home');

  const FEATURES = [
    {
      key: 'escrow',
      title: t('features.escrow'),
      description: t('features.escrowDesc'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
        />
      ),
    },
    {
      key: 'kyc',
      title: t('features.kyc'),
      description: t('features.kycDesc'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5a2.25 2.25 0 0 0 2.25 2.25Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z"
        />
      ),
    },
    {
      key: 'kuraimi',
      title: t('features.kuraimi'),
      description: t('features.kuraimiDesc'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"
        />
      ),
    },
    {
      key: 'paypal',
      title: t('features.paypal'),
      description: t('features.paypalDesc'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5a2.25 2.25 0 0 0 2.25 2.25Z"
        />
      ),
    },
  ] as const;

  const STEPS = [
    {
      number: '١',
      title: t('steps.register'),
      description: t('steps.registerDesc'),
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
      title: t('steps.post'),
      description: t('steps.postDesc'),
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
      title: t('steps.hire'),
      description: t('steps.hireDesc'),
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
      title: t('steps.pay'),
      description: t('steps.payDesc'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
        />
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

  return (
    <div className="flex flex-1 flex-col">
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:py-28">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">{t('heroDescription')}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/projects"
              className="w-full rounded-xl bg-emerald-600 px-8 py-3.5 text-center font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto"
            >
              {t('heroSecondary')}
            </Link>
            <Link
              href="/register"
              className="w-full rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-center font-semibold text-gray-700 transition hover:border-emerald-600 hover:text-emerald-700 sm:w-auto"
            >
              {t('heroCta')}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-[#f4f5f7]">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">{t('featuresTitle')}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.key} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <h3 className="mt-5 text-base font-bold text-gray-900">{feature.title}</h3>
                <p className="mt-2.5 text-sm leading-6 text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('stepsTitle')}</h2>
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
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
