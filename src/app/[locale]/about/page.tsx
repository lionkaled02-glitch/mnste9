import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

type Card = { icon: string; title: string; description: string };
type Stat = { value: string; label: string };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      type: 'website',
      url: 'https://khadamat.com/about',
    },
  };
}

export default async function AboutPage() {
  const t = await getTranslations('about');
  const values = t.raw('valuesItems') as Card[];
  const stats = t.raw('statsItems') as Stat[];
  const reasons = t.raw('whyItems') as Card[];

  return (
    <main className="bg-white" dir="rtl">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#2386c8]/10 via-white to-white py-16 sm:py-20">
        <div className="absolute left-8 top-8 hidden h-32 w-32 rounded-full bg-[#2386c8]/10 blur-3xl sm:block" />
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-4xl shadow-lg ring-1 ring-[#2386c8]/10">🤝</div>
          <h1 className="mt-6 text-4xl font-extrabold text-[#222] sm:text-5xl">{t('title')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#666]">{t('heroDescription')}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 md:grid-cols-2">
          <div className="rounded-3xl border border-[#2386c8]/20 bg-white p-8 shadow-lg shadow-[#2386c8]/5">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2386c8]/10 text-3xl">👁️</div>
            <h2 className="text-2xl font-bold text-[#222]">{t('vision')}</h2>
            <p className="mt-3 leading-8 text-[#666]">{t('visionText')}</p>
          </div>
          <div className="rounded-3xl border border-[#2386c8]/20 bg-white p-8 shadow-lg shadow-[#2386c8]/5">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2386c8]/10 text-3xl">🎯</div>
            <h2 className="text-2xl font-bold text-[#222]">{t('mission')}</h2>
            <p className="mt-3 leading-8 text-[#666]">{t('missionText')}</p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="text-sm font-bold text-[#2386c8]">{t('valuesEyebrow')}</p>
            <h2 className="mt-2 text-3xl font-extrabold text-[#222]">{t('values')}</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div key={value.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#2386c8]/30 hover:shadow-lg">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2386c8]/10 text-3xl">{value.icon}</div>
                <h3 className="mt-5 text-lg font-extrabold text-[#222]">{value.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#666]">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold text-[#222]">{t('numbers')}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl bg-[#222] p-7 text-center text-white shadow-lg">
                <p className="text-3xl font-extrabold text-white">{stat.value}</p>
                <p className="mt-2 text-sm text-white/75">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold text-[#2386c8]">{t('whyEyebrow')}</p>
            <h2 className="mt-2 text-3xl font-extrabold text-[#222]">{t('whyTitle')}</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reasons.map((reason) => (
              <div key={reason.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2386c8]/10 text-2xl">{reason.icon}</span>
                  <h3 className="text-lg font-extrabold text-[#222]">{reason.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-7 text-[#666]">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-[#2386c8] p-8 text-center text-white shadow-xl sm:p-12">
          <h2 className="text-3xl font-extrabold">{t('ctaTitle')}</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-8 text-white/85">{t('ctaDescription')}</p>
          <Link href="/register" className="mt-7 inline-flex rounded-2xl bg-white px-7 py-3 text-sm font-extrabold text-[#2386c8] transition hover:bg-slate-100">
            {t('ctaButton')}
          </Link>
        </div>
      </section>
    </main>
  );
}
