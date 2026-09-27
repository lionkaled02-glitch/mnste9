import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

type LegalSection = { title: string; body: string };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacy');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      type: 'website',
      url: 'https://khadamat.com/privacy',
    },
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations('privacy');
  const sections = t.raw('sections') as LegalSection[];

  return (
    <main className="bg-white" dir="rtl">
      <section className="bg-gradient-to-b from-[#2386c8]/10 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-4xl shadow-lg">🔐</div>
          <h1 className="mt-6 text-4xl font-extrabold text-[#222] sm:text-5xl">{t('title')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#666]">{t('subtitle')}</p>
          <p className="mt-4 text-sm font-semibold text-[#2386c8]">{t('lastUpdated')}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <div className="sticky top-24 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="font-extrabold text-[#222]">{t('tocTitle')}</h2>
            <ol className="mt-4 space-y-2 text-sm text-[#666]">
              {sections.map((section, index) => (
                <li key={section.title}>
                  <a href={`#privacy-${index}`} className="transition hover:text-[#2386c8]">
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <div className="lg:col-span-8">
          <div className="space-y-5">
            {sections.map((section, index) => (
              <section key={section.title} id={`privacy-${index}`} className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-2xl font-extrabold text-[#222]">{section.title}</h2>
                <p className="mt-4 whitespace-pre-line text-sm leading-8 text-[#666]">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-8 rounded-3xl bg-[#2386c8] p-6 text-white sm:p-8">
            <h2 className="text-2xl font-extrabold">{t('contactTitle')}</h2>
            <p className="mt-3 leading-8 text-white/85">{t('contactText')}</p>
            <Link href="/contact" className="mt-5 inline-flex rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-[#2386c8]">
              {t('contactButton')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
