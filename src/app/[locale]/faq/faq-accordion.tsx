'use client';

import { useMemo, useState } from 'react';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCategory {
  id: string;
  name: string;
  icon: string;
  items: FAQItem[];
}

interface FAQAccordionProps {
  categories: FAQCategory[];
  labels: {
    searchPlaceholder: string;
    all: string;
    noResults: string;
  };
}

export function FAQAccordion({ categories, labels }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          if (!normalizedSearch) return true;
          return `${item.question} ${item.answer}`.toLowerCase().includes(normalizedSearch);
        }),
      }))
      .filter((category) => (activeCategory === 'all' || category.id === activeCategory) && category.items.length > 0);
  }, [activeCategory, categories, search]);

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">⌕</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={labels.searchPlaceholder}
          className="w-full rounded-2xl border border-slate-200 bg-white py-4 pe-12 ps-4 text-sm outline-none transition focus:border-[#2386c8] focus:ring-4 focus:ring-[#2386c8]/10"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            activeCategory === 'all'
              ? 'bg-[#2386c8] text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-[#2386c8]/40 hover:text-[#2386c8]'
          }`}
        >
          {labels.all}
        </button>
        {categories.map((category) => (
          <button
            type="button"
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              activeCategory === category.id
                ? 'bg-[#2386c8] text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-[#2386c8]/40 hover:text-[#2386c8]'
            }`}
          >
            <span aria-hidden="true">{category.icon}</span> {category.name}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-8">
        {filteredCategories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#2386c8]/10 text-2xl">🔎</div>
            <p className="mt-4 font-bold text-slate-700">{labels.noResults}</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <section key={category.id}>
              <h2 className="mb-4 text-xl font-extrabold text-[#222]">
                <span aria-hidden="true">{category.icon}</span> {category.name}
              </h2>
              <div className="space-y-3">
                {category.items.map((item, index) => {
                  const id = `${category.id}-${index}`;
                  const isOpen = openId === id;

                  return (
                    <div key={id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : id)}
                        className="flex w-full items-center justify-between gap-4 p-5 text-right transition hover:bg-slate-50"
                        aria-expanded={isOpen}
                      >
                        <span className="font-bold leading-7 text-[#222]">{item.question}</span>
                        <span className={`shrink-0 text-[#2386c8] transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">
                          ▼
                        </span>
                      </button>
                      {isOpen && <div className="border-t border-slate-100 p-5 text-sm leading-8 text-[#666]">{item.answer}</div>}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
