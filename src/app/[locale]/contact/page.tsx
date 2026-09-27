import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ContactForm } from './contact-form';

type ContactInfo = { icon: string; label: string; value: string; dir?: 'ltr' | 'rtl' };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contact');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      type: 'website',
      url: 'https://khadamat.com/contact',
    },
  };
}

export default async function ContactPage() {
  const t = await getTranslations('contact');
  const infoItems = t.raw('infoItems') as ContactInfo[];

  return (
    <main className="min-h-screen bg-slate-50" dir="rtl">
      <section className="bg-gradient-to-b from-[#2386c8]/10 to-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-4xl shadow-lg">💬</div>
          <h1 className="mt-6 text-4xl font-extrabold text-[#222] sm:text-5xl">{t('title')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#666]">{t('subtitle')}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 lg:grid-cols-12">
        <div className="-mt-8 lg:col-span-7">
          <ContactForm
            labels={{
              name: t('form.name'),
              email: t('form.email'),
              subject: t('form.subject'),
              message: t('form.message'),
              submit: t('form.submit'),
              submitting: t('form.submitting'),
              success: t('form.success'),
              invalid: t('form.invalid'),
              error: t('form.error'),
            }}
          />
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-bold text-[#2386c8]">{t('infoEyebrow')}</p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#222]">{t('infoTitle')}</h2>
            <p className="mt-3 text-sm leading-7 text-[#666]">{t('infoDescription')}</p>

            <div className="mt-8 space-y-4">
              {infoItems.map((item) => (
                <div key={item.label} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2386c8]/10 text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-extrabold text-[#222]">{item.label}</p>
                    <p className="mt-1 text-sm text-[#666]" dir={item.dir ?? 'rtl'}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-[#2386c8] p-6 text-white shadow-lg">
            <h3 className="text-xl font-extrabold">{t('promiseTitle')}</h3>
            <p className="mt-3 text-sm leading-7 text-white/85">{t('promiseText')}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
