import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { JsonLd } from '@/components/seo/json-ld';
import { buildMetadata, normalizeLocale } from '@/lib/seo/metadata';
import { faqSchema } from '@/lib/seo/structured-data';

import { Link } from '@/i18n/navigation';
import { FAQAccordion, type FAQCategory } from './faq-accordion';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const normalizedLocale = normalizeLocale(locale);
  const t = await getTranslations({ locale, namespace: 'seo.faq' });

  return buildMetadata({
    title: t('title'),
    description: t('description'),
    path: '/faq',
    locale: normalizedLocale,
    keywords: ['الأسئلة الشائعة', 'دعم', 'الدفع', 'التوثيق', 'خدمات'],
  });
}

export default async function FAQPage() {
  const t = await getTranslations('faq');
  const categories = t.raw('items') as FAQCategory[];
  const allFaqs = categories.flatMap((category) => category.items);

  return (
    <>
      <JsonLd data={faqSchema(allFaqs)} />
      <main className="min-h-screen bg-slate-50" dir="rtl">
      <section className="bg-gradient-to-b from-[#2386c8]/10 to-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-4xl shadow-lg">❓</div>
          <h1 className="mt-6 text-4xl font-extrabold text-[#222] sm:text-5xl">{t('title')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#666]">{t('subtitle')}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="-mt-8 rounded-[2rem] border border-slate-200 bg-white/70 p-4 shadow-xl shadow-slate-200/60 backdrop-blur sm:p-8">
          <FAQAccordion
            categories={categories}
            labels={{
              searchPlaceholder: t('searchPlaceholder'),
              all: t('all'),
              noResults: t('noResults'),
            }}
          />
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-[#2386c8]/20 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-extrabold text-[#222]">{t('ctaTitle')}</h2>
          <p className="mt-3 text-sm leading-7 text-[#666]">{t('ctaDescription')}</p>
          <Link href="/contact" className="mt-6 inline-flex rounded-2xl bg-[#2386c8] px-7 py-3 text-sm font-extrabold text-white transition hover:bg-[#1a6da8]">
            {t('ctaButton')}
          </Link>
        </div>
      </section>
      </main>
    </>
  );
}
