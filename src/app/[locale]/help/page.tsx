import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

import { HELP_ARTICLES } from '@/lib/help-content';

import { HelpSearch } from './help-search';
import { buildMetadata, normalizeLocale } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const normalizedLocale = normalizeLocale(locale);
  const t = await getTranslations({ locale, namespace: 'seo.help' });

  return buildMetadata({
    title: t('title'),
    description: t('description'),
    path: '/help',
    locale: normalizedLocale,
    keywords: ['مركز المساعدة', 'دعم', 'ضمان الحقوق', 'خدمات'],
  });
}

const CATEGORY_LABELS = [
  { id: 'freelancers', label: 'للمستقلين' },
  { id: 'clients', label: 'لأصحاب الأعمال' },
  { id: 'general', label: 'عام' },
] as const;

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-white" dir="rtl">
      <section className="border-b border-slate-200 bg-gradient-to-b from-[#2386c8]/10 to-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-[#2386c8]/10 px-4 py-2 text-sm font-extrabold text-[#2386c8]">مركز المساعدة</span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-[#222] sm:text-5xl">دليل خدمات لاستخدام المنصة بثقة</h1>
            <p className="mt-5 text-lg leading-9 text-[#666]">
              بدلاً من بطاقات مختصرة، جمعنا أهم المقالات في صفحات مرتبة وواضحة تساعدك على البدء، فهم الضمان المالي، وإدارة مشاريعك باحترافية.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <div className="sticky top-24 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-extrabold text-[#222]">فهرس المقالات</h2>
            <nav className="mt-5 space-y-5" aria-label="فهرس مركز المساعدة">
              {CATEGORY_LABELS.map((category) => {
                const articles = HELP_ARTICLES.filter((article) => article.category === category.id);
                return (
                  <div key={category.id}>
                    <h3 className="text-sm font-extrabold text-[#2386c8]">{category.label}</h3>
                    <ul className="mt-2 space-y-2 border-r border-slate-200 pr-4">
                      {articles.map((article) => (
                        <li key={article.slug}>
                          <Link href={`/help/${article.slug}`} className="text-sm leading-7 text-[#666] transition hover:text-[#2386c8]">
                            {article.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="lg:col-span-8">
          <div className="border-b border-slate-200 pb-6">
            <h2 className="text-2xl font-extrabold text-[#222]">المقالات</h2>
            <p className="mt-2 text-sm leading-7 text-[#666]">اختر المقال المناسب وانتقل إلى صفحة مخصصة بتفاصيل منظمة وخطوات عملية.</p>
          </div>

          <HelpSearch articles={HELP_ARTICLES} />

          <section className="mt-10 rounded-[2rem] bg-[#2386c8] p-8 text-white">
            <h2 className="text-2xl font-extrabold">لم تجد ما تبحث عنه؟</h2>
            <p className="mt-3 max-w-2xl leading-8 text-white/85">تواصل معنا عبر صفحة الدعم، وسيساعدك فريق خدمات في أقرب وقت ممكن.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-[#2386c8] transition hover:bg-slate-100">
                تواصل معنا
              </Link>
              <Link href="/faq" className="rounded-2xl border border-white/40 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-white/10">
                الأسئلة الشائعة
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
