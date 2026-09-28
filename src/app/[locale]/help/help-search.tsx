'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import type { HelpArticle } from '@/lib/help-content';

export function HelpSearch({ articles }: { articles: HelpArticle[] }) {
  const t = useTranslations('help.search');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) return articles;

    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(trimmedQuery) ||
        article.description.toLowerCase().includes(trimmedQuery) ||
        article.categoryLabel.toLowerCase().includes(trimmedQuery) ||
        article.sections.some(
          (section) =>
            section.title.toLowerCase().includes(trimmedQuery) ||
            section.body.some((paragraph) => paragraph.toLowerCase().includes(trimmedQuery)),
        ),
    );
  }, [articles, query]);

  return (
    <div>
      <div className="relative mb-8">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('placeholder')}
          className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-4 text-base outline-none transition focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/20"
        />
        <svg className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>

      {query && filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-500">{t('empty', { query })}</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {filtered.map((article, index) => (
            <article key={article.slug} className="py-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="rounded-full bg-[#2386c8]/10 px-3 py-1 text-[#2386c8]">{article.categoryLabel}</span>
                    <span className="text-slate-400">{article.readTime}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-extrabold text-[#222]">
                    <Link href={`/help/${article.slug}`} className="transition hover:text-[#2386c8]">
                      {index + 1}. {article.title}
                    </Link>
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[#666]">{article.description}</p>
                </div>
                <Link
                  href={`/help/${article.slug}`}
                  className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-[#222] transition hover:border-[#2386c8] hover:text-[#2386c8]"
                >
                  {t('readArticle')}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
