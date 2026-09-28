import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Link } from '@/i18n/navigation';
import { getHelpArticle, HELP_ARTICLES } from '@/lib/help-content';

import { ArticleFeedback } from './article-feedback';

interface HelpArticlePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return HELP_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: HelpArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticle(slug);

  if (!article) {
    return {
      title: 'مقال غير موجود | خدمات',
    };
  }

  return {
    title: `${article.title} | مركز المساعدة | خدمات`,
    description: article.description,
    openGraph: {
      title: `${article.title} | خدمات`,
      description: article.description,
      type: 'article',
    },
  };
}

export default async function HelpArticlePage({ params }: HelpArticlePageProps) {
  const { slug } = await params;
  const article = getHelpArticle(slug);

  if (!article) notFound();

  const relatedArticles = HELP_ARTICLES.filter((item) => item.category === article.category && item.slug !== article.slug).slice(0, 3);

  return (
    <main className="min-h-screen bg-white" dir="rtl">
      <section className="border-b border-slate-200 bg-gradient-to-b from-[#2386c8]/10 to-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
          <Breadcrumbs
            items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'مركز المساعدة', href: '/help' },
              { label: article.title },
            ]}
          />
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-[#222] sm:text-5xl">{article.title}</h1>
          <p className="mt-5 text-lg leading-9 text-[#666]">{article.description}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-[#2386c8]/10 px-3 py-1 text-[#2386c8]">{article.categoryLabel}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">{article.readTime}</span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <div className="sticky top-24 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-extrabold text-[#222]">محتوى المقال</h2>
            <ol className="mt-4 space-y-2 border-r border-slate-200 pr-4 text-sm text-[#666]">
              {article.sections.map((section, index) => (
                <li key={section.title}>
                  <a href={`#section-${index}`} className="leading-7 transition hover:text-[#2386c8]">
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <Link href="/help" className="text-sm font-bold text-[#2386c8] hover:underline">← العودة إلى مركز المساعدة</Link>
            </div>
          </div>
        </aside>

        <article className="lg:col-span-8">
          <div className="prose prose-slate max-w-none">
            {article.sections.map((section, index) => (
              <section key={section.title} id={`section-${index}`} className="scroll-mt-24 border-b border-slate-200 py-8 first:pt-0 last:border-b-0">
                <h2 className="text-2xl font-extrabold text-[#222]">{section.title}</h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-base leading-9 text-[#666]">{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10">
            <ArticleFeedback />
          </div>

          {relatedArticles.length > 0 && (
            <section className="mt-12 border-t border-slate-200 pt-8">
              <h2 className="mb-6 text-xl font-bold text-[#222]">مقالات ذات صلة</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/help/${related.slug}`}
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-[#2386c8] hover:shadow-lg"
                  >
                    <h3 className="font-bold leading-7 text-[#222]">{related.title}</h3>
                    <p className="mt-2 text-xs text-slate-500">{related.readTime}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <footer className="mt-10 rounded-[2rem] border border-[#2386c8]/20 bg-[#2386c8]/5 p-6">
            <h2 className="text-xl font-extrabold text-[#222]">هل تحتاج مساعدة إضافية؟</h2>
            <p className="mt-2 text-sm leading-7 text-[#666]">فريق خدمات جاهز لمساعدتك في الحسابات، المشاريع، الضمان المالي، والتوثيق.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/contact" className="rounded-2xl bg-[#2386c8] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#1a6da8]">
                تواصل معنا
              </Link>
              <Link href="/faq" className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-[#222] transition hover:border-[#2386c8] hover:text-[#2386c8]">
                الأسئلة الشائعة
              </Link>
            </div>
          </footer>
        </article>
      </section>
    </main>
  );
}
